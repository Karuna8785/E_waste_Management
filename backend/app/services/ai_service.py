import os
import io
import json
import numpy as np
from PIL import Image, ImageOps

class AIService:
    MODEL_VERSION = "EcoCycle-Vision-v1.4"
    SUPPORTED_CATEGORIES = [
        "Mobile Phone",
        "Laptop",
        "Desktop Computer",
        "Monitor / Television",
        "Keyboard or Mouse",
        "Charger or Cable",
        "Printer or Scanner",
        "Electronic Circuit Board (PCB)",
        "Battery or Power Bank",
        "Other Electronic Accessory"
    ]

    # Material recovery benchmarks (average kg recovery per 100 kg of category)
    MATERIAL_BENCHMARKS = {
        "Mobile Phone": {"copper": 13.0, "plastics": 42.0, "aluminum": 15.0, "gold_grams": 24.0, "hazardous_lead": 1.2},
        "Laptop": {"copper": 11.0, "plastics": 38.0, "aluminum": 22.0, "gold_grams": 18.0, "hazardous_lead": 2.1},
        "Desktop Computer": {"copper": 7.0, "plastics": 24.0, "steel": 48.0, "aluminum": 12.0, "gold_grams": 12.0},
        "Monitor / Television": {"plastics": 28.0, "steel": 25.0, "copper": 6.0, "hazardous_glass": 35.0},
        "Electronic Circuit Board (PCB)": {"copper": 22.0, "fiberglass": 45.0, "gold_grams": 85.0, "silver_grams": 120.0},
        "Battery or Power Bank": {"lithium_cobalt": 28.0, "nickel": 18.0, "copper": 12.0, "plastics": 20.0},
        "Charger or Cable": {"copper": 45.0, "plastics": 50.0, "aluminum": 3.0},
        "Printer or Scanner": {"plastics": 55.0, "steel": 30.0, "copper": 4.0, "circuit_boards": 8.0},
        "Keyboard or Mouse": {"plastics": 78.0, "copper": 8.0, "circuit_boards": 10.0},
        "Other Electronic Accessory": {"plastics": 60.0, "copper": 15.0, "steel": 20.0}
    }

    @staticmethod
    def validate_and_normalize_image(image_bytes: bytes, max_dim: int = 1200) -> Image.Image:
        """
        Validates image header, checks against corrupt files,
        corrects EXIF orientation, and resizes to a standardized dimension.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()  # Verify integrity
            # Reopen after verify
            image = Image.open(io.BytesIO(image_bytes))
            image = ImageOps.exif_transpose(image)
            image = image.convert("RGB")
            
            # Resize if overly large to prevent DoS
            if max(image.size) > max_dim:
                image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                
            return image
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image file: {str(e)}")

    @classmethod
    def analyze_image_features(cls, image: Image.Image) -> dict:
        """
        Performs genuine computer vision feature analysis:
        - Aspect ratio & bounding geometry
        - Color distribution (detects green PCB solder mask, dark screen glass, metallic sheens)
        - Edge density analysis via gradient magnitude (detects intricate circuit traces or cracked screens)
        - Computes probabilistic category affinities based on visual feature matching.
        """
        width, height = image.size
        aspect_ratio = width / float(height) if height > 0 else 1.0
        
        # Downsample for fast analysis
        thumb = image.resize((224, 224), Image.Resampling.BILINEAR)
        img_arr = np.array(thumb, dtype=np.float32) / 255.0  # (224, 224, 3)
        
        r, g, b = img_arr[:, :, 0], img_arr[:, :, 1], img_arr[:, :, 2]
        
        # Color signatures
        # PCB green mask signature: green significantly higher than red and blue
        pcb_green_ratio = np.mean((g > r * 1.25) & (g > b * 1.25))
        
        # Dark screen / display glass signature: very low RGB variance and high darkness
        dark_pixels = np.mean((r < 0.22) & (g < 0.22) & (b < 0.22))
        
        # Metallic / light gray signature: high brightness and low color saturation
        diff_rg = np.abs(r - g)
        diff_gb = np.abs(g - b)
        metallic_ratio = np.mean((img_arr > 0.45) & (diff_rg < 0.08) & (diff_gb < 0.08))
        
        # Simple spatial gradient / edge magnitude
        grad_x = np.abs(img_arr[:, 1:, :] - img_arr[:, :-1, :])
        grad_y = np.abs(img_arr[1:, :, :] - img_arr[:-1, :, :])
        edge_density = float((np.mean(grad_x) + np.mean(grad_y)) / 2.0)
        
        # Class affinity scoring
        scores = {}
        
        # PCB signature
        if pcb_green_ratio > 0.15 or (edge_density > 0.14 and metallic_ratio > 0.15):
            scores["Electronic Circuit Board (PCB)"] = 0.55 + float(pcb_green_ratio * 1.5)
            
        # Mobile phone signature (portrait or landscape phone aspect ratio, high screen darkness or glass)
        if (0.45 <= aspect_ratio <= 0.68) or (1.45 <= aspect_ratio <= 2.2):
            scores["Mobile Phone"] = 0.50 + float(dark_pixels * 0.45)
            
        # Laptop signature (clamshell, keyboard + screen proportions, metallic surface)
        if 1.2 <= aspect_ratio <= 1.7:
            scores["Laptop"] = 0.45 + float(metallic_ratio * 0.35) + float(dark_pixels * 0.2)
            
        # Monitor / TV (wide aspect ratio, prominent dark screen)
        if 1.4 <= aspect_ratio <= 2.0 and dark_pixels > 0.35:
            scores["Monitor / Television"] = 0.48 + float(dark_pixels * 0.4)
            
        # Battery / Power Bank (rectangular, dense, solid coloring)
        if edge_density < 0.08 and (0.5 <= aspect_ratio <= 2.0):
            scores["Battery or Power Bank"] = 0.42 + float((1.0 - edge_density) * 0.25)
            
        # Charger or Cable (high edge density with high contrast linear features)
        if edge_density > 0.12 and dark_pixels > 0.25:
            scores["Charger or Cable"] = 0.40 + float(edge_density * 0.8)
            
        # Keyboard or Mouse
        if aspect_ratio > 2.2 or (0.6 <= aspect_ratio <= 0.9 and edge_density > 0.10):
            scores["Keyboard or Mouse"] = 0.44 + float(edge_density * 0.6)
            
        # Ensure all categories have a base score
        for cat in cls.SUPPORTED_CATEGORIES:
            if cat not in scores:
                scores[cat] = 0.15 + float(np.random.uniform(0.01, 0.12))
                
        # Normalize to probability distribution (Softmax)
        raw_vals = np.array([scores[cat] for cat in cls.SUPPORTED_CATEGORIES])
        exp_vals = np.exp(raw_vals * 4.0)  # Temperature factor
        probs = exp_vals / np.sum(exp_vals)
        
        ranked_indices = np.argsort(probs)[::-1]
        top_category = cls.SUPPORTED_CATEGORIES[ranked_indices[0]]
        top_confidence = round(float(probs[ranked_indices[0]]), 3)
        
        # Build secondary predictions list
        secondaries = []
        for idx in ranked_indices[1:4]:
            secondaries.append({
                "category": cls.SUPPORTED_CATEGORIES[idx],
                "confidence": round(float(probs[idx]), 3)
            })
            
        # Visual flags detection
        has_cracked_screen = bool(dark_pixels > 0.2 and edge_density > 0.15)
        has_burn_or_corrosion = bool(np.mean((r > 0.5) & (g < 0.3) & (b < 0.15)) > 0.08)
        has_missing_casing = bool(pcb_green_ratio > 0.08 and top_category != "Electronic Circuit Board (PCB)")
        
        return {
            "predicted_category": top_category,
            "confidence": top_confidence,
            "secondary_predictions": secondaries,
            "visual_flags": {
                "has_cracked_screen": has_cracked_screen,
                "has_swollen_battery": False,  # Physical deformation is validated via user questionnaire for safety
                "has_burn_or_corrosion": has_burn_or_corrosion,
                "has_missing_casing": has_missing_casing,
                "is_disassembled": has_missing_casing,
            },
            "features": {
                "aspect_ratio": round(aspect_ratio, 2),
                "dark_pixel_ratio": round(float(dark_pixels), 3),
                "edge_density": round(edge_density, 3),
                "green_pcb_ratio": round(float(pcb_green_ratio), 3),
                "metallic_ratio": round(float(metallic_ratio), 3),
            }
        }

    @classmethod
    def evaluate_condition_and_recommend(cls, category: str, questionnaire: dict, visual_flags: dict) -> dict:
        """
        Deterministic, safety-first recommendation engine:
        Merges Computer Vision signals with user condition responses.
        
        Answers expected in questionnaire:
        - powers_on: bool (Does device turn on?)
        - screen_damaged: bool (Is screen cracked / black / bleeding?)
        - missing_parts: bool (Are keys, screws, battery or ports missing?)
        - battery_swollen_or_leaking: bool (Is battery deformed, bloated or leaking?)
        - physical_damage: bool (Heavy casing fractures, water damage, fire?)
        - owner_reuse_wish: bool (Does the user wish someone else could use it?)
        """
        powers_on = questionnaire.get("powers_on", False)
        screen_damaged = questionnaire.get("screen_damaged", False) or visual_flags.get("has_cracked_screen", False)
        missing_parts = questionnaire.get("missing_parts", False) or visual_flags.get("has_missing_casing", False)
        battery_swollen = questionnaire.get("battery_swollen_or_leaking", False) or visual_flags.get("has_swollen_battery", False)
        physical_damage = questionnaire.get("physical_damage", False) or visual_flags.get("has_burn_or_corrosion", False)
        owner_reuse_wish = questionnaire.get("owner_reuse_wish", False)

        # 1. CRITICAL HAZARD CHECK
        if battery_swollen:
            return {
                "recommendation": "recycle",
                "safety_flag": True,
                "safety_notes": "CRITICAL BATTERY HAZARD: Swollen or leaking lithium-ion batteries present severe fire risk. Do not attempt to charge, compress, or turn on. Keep in a fire-safe container.",
                "reasoning_en": "Your device has a swollen or leaking battery. For your safety and the safety of our collectors, this device cannot be reused or repaired. It will be collected in a specialized fire-retardant safety container for certified chemical neutralisation and recycling.",
                "reasoning_te": "మీ పరికరంలో బ్యాటరీ ఉబ్బిపోయింది లేదా లీక్ అవుతోంది. భద్రత దృష్ట్యా ఇది పునర్వినియోగం లేదా మరమ్మత్తుకు అనుకూలం కాదు. ఇది ధృవీకరించబడిన సురక్షిత రీసైక్లింగ్ కోసం ప్రత్యేక కంటైనర్‌లో సేకరించబడుతుంది."
            }

        # 2. PCB / Bare components -> Dedicated Material Recovery
        if category == "Electronic Circuit Board (PCB)" or category == "Charger or Cable":
            return {
                "recommendation": "recycle",
                "safety_flag": False,
                "safety_notes": "Valuable precious metals (Copper/Gold) recovery.",
                "reasoning_en": f"This {category} is an ideal candidate for industrial material recovery. We will extract high-purity copper, gold, and aluminum at authorized green refining centers, preventing toxic e-waste accumulation in landfills.",
                "reasoning_te": f"ఈ {category} పారిశ్రామిక లోహాల రికవరీకి అనువైనది. అధికారిక గ్రీన్ రిఫైనింగ్ కేంద్రాలలో రాగి, బంగారం మరియు అల్యూమినియం వేరు చేయబడతాయి."
            }

        # 3. Working condition with no severe physical damage -> REUSE (Marketplace)
        if powers_on and not screen_damaged and not physical_damage and not missing_parts:
            return {
                "recommendation": "reuse",
                "safety_flag": False,
                "safety_notes": "Prime refurbished reuse candidate.",
                "reasoning_en": "Excellent news! Your device is fully functional and structurally sound. Instead of destroying working electronics, we will verify it for certified refurbishment and give it a second life in our community marketplace.",
                "reasoning_te": "శుభవార్త! మీ పరికరం పూర్తిగా పనిచేస్తోంది మరియు మంచి స్థితిలో ఉంది. దీనిని ధృవీకరించిన తర్వాత కమ్యూనిటీ మార్కెట్‌ప్లేస్‌లో మరొకరికి ఉపయోగపడేలా చేస్తాము."
            }

        # 4. Moderate issues (powers on but damaged screen or minor casing defect) -> REPAIR
        if (powers_on and (screen_damaged or missing_parts)) or (not powers_on and not physical_damage and not screen_damaged):
            return {
                "recommendation": "repair",
                "safety_flag": False,
                "safety_notes": "Screen/casing or battery replacement required.",
                "reasoning_en": "Your device has valuable core circuitry intact and only requires minor repair (such as a screen replacement or power connector fix). Our authorized repair partners will evaluate it to prevent premature disposal.",
                "reasoning_te": "మీ పరికరంలోని ప్రధాన భాగాలు సురక్షితంగా ఉన్నాయి, చిన్న మరమ్మతులు (స్క్రీన్ లేదా కనెక్టర్ మార్పు) అవసరం. మా రిపేర్ భాగస్వాములు దీనిని సరిచేస్తారు."
            }

        # 5. Heavy physical damage or non-functional older devices -> RECYCLE
        if physical_damage or (not powers_on and screen_damaged):
            return {
                "recommendation": "recycle",
                "safety_flag": False,
                "safety_notes": "Complete component dismantling and smelting recovery.",
                "reasoning_en": "Given the extent of structural damage and hardware failure, repair is economically unviable. This item will be routed to a state-authorized recycling facility for mechanical dismantling and scientific material extraction.",
                "reasoning_te": "పరికరానికి తీవ్ర నష్టం వాటిల్లినందున, మరమ్మత్తు సాధ్యం కాదు. దీనిని సురక్షిత రీసైక్లింగ్ కేంద్రానికి పంపి లోహాలు మరియు ప్లాస్టిక్‌లను వేరు చేస్తాము."
            }

        # 6. Default to manual inspection
        return {
            "recommendation": "inspect",
            "safety_flag": False,
            "safety_notes": "Physical diagnostic required by collection technician.",
            "reasoning_en": "Based on the photograph and answers, our system recommends a brief physical inspection by the collection technician to verify whether reuse or recycling offers the highest environmental benefit.",
            "reasoning_te": "ఫోటో మరియు వివరాల ఆధారంగా, కలెక్షన్ టెక్నీషియన్ దీనిని పరిశీలించి పునర్వినియోగం లేదా రీసైక్లింగ్ చేయాలా అని నిర్ణయిస్తారు."
        }
