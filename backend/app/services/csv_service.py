import csv
import io

class CSVService:
    REQUIRED_COLUMNS = [
        "device_name",
        "category",
        "quantity",
        "estimated_weight_kg",
        "condition",
        "serial_or_asset_tag",
        "location_notes"
    ]

    VALID_CATEGORIES = [
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

    VALID_CONDITIONS = ["working", "minor_damage", "faulty", "scrap_non_functional"]

    @classmethod
    def generate_bulk_template_csv(cls) -> str:
        """
        Generates standard CSV template with realistic sample rows.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(cls.REQUIRED_COLUMNS)
        # Sample rows
        writer.writerow(["Dell Latitude 5490", "Laptop", "15", "28.5", "working", "ASSET-DL-001", "IT Dept, Block B, 2nd Floor"])
        writer.writerow(["HP LaserJet Pro 400", "Printer or Scanner", "3", "34.2", "faulty", "ASSET-HP-401", "Admin Office, Ground Floor"])
        writer.writerow(["Samsung 24-inch LED", "Monitor / Television", "10", "32.0", "scrap_non_functional", "ASSET-SM-101", "Computer Lab 3"])
        writer.writerow(["Cisco Catalyst Switch", "Electronic Circuit Board (PCB)", "2", "8.4", "minor_damage", "ASSET-CS-902", "Server Room Rack 4"])
        writer.writerow(["Mixed HDMI & Power Cables", "Charger or Cable", "50", "12.0", "working", "BUNDLE-CAB-01", "Storage Locker A"])
        return output.getvalue()

    @classmethod
    def validate_and_parse_bulk_csv(cls, file_content: str) -> dict:
        """
        Parses and strictly validates uploaded bulk asset CSV file.
        """
        errors = []
        valid_rows = []
        seen_tags = set()
        total_weight = 0.0
        total_items = 0

        try:
            reader = csv.DictReader(io.StringIO(file_content.strip()))
            
            # Check headers
            if not reader.fieldnames:
                return {"success": False, "errors": ["Uploaded file is empty or missing headers."], "rows": []}
                
            missing_headers = [col for col in cls.REQUIRED_COLUMNS if col not in reader.fieldnames]
            if missing_headers:
                return {
                    "success": False,
                    "errors": [f"Missing required columns in CSV: {', '.join(missing_headers)}"],
                    "rows": []
                }

            row_num = 1  # 1-indexed (header is line 1)
            for row in reader:
                row_num += 1
                row_errors = []

                device_name = (row.get("device_name") or "").strip()
                category = (row.get("category") or "").strip()
                qty_raw = (row.get("quantity") or "").strip()
                weight_raw = (row.get("estimated_weight_kg") or "").strip()
                condition = (row.get("condition") or "").strip().lower()
                tag = (row.get("serial_or_asset_tag") or "").strip()
                notes = (row.get("location_notes") or "").strip()

                if not device_name:
                    row_errors.append(f"Row {row_num}: device_name cannot be blank.")

                if category not in cls.VALID_CATEGORIES:
                    # Soft match or flag
                    matched = None
                    for cat in cls.VALID_CATEGORIES:
                        if cat.lower() in category.lower() or category.lower() in cat.lower():
                            matched = cat
                            break
                    if matched:
                        category = matched
                    else:
                        row_errors.append(f"Row {row_num}: '{category}' is not a recognized category. Must be one of: {', '.join(cls.VALID_CATEGORIES[:4])}...")

                try:
                    qty = int(qty_raw)
                    if qty <= 0:
                        row_errors.append(f"Row {row_num}: quantity must be a positive integer.")
                except ValueError:
                    row_errors.append(f"Row {row_num}: invalid quantity '{qty_raw}'. Must be an integer.")
                    qty = 1

                try:
                    weight = float(weight_raw)
                    if weight <= 0:
                        row_errors.append(f"Row {row_num}: estimated_weight_kg must be greater than 0.")
                except ValueError:
                    row_errors.append(f"Row {row_num}: invalid weight '{weight_raw}'. Must be a decimal number.")
                    weight = 1.0

                if condition not in cls.VALID_CONDITIONS:
                    condition = "scrap_non_functional"  # Safe default

                if tag:
                    if tag in seen_tags:
                        row_errors.append(f"Row {row_num}: duplicate asset/serial tag '{tag}'.")
                    else:
                        seen_tags.add(tag)

                if row_errors:
                    errors.extend(row_errors)
                else:
                    valid_rows.append({
                        "device_name": device_name,
                        "category": category,
                        "quantity": qty,
                        "estimated_weight_kg": weight,
                        "condition": condition,
                        "serial_or_asset_tag": tag,
                        "location_notes": notes
                    })
                    total_weight += weight
                    total_items += qty

            if errors:
                return {
                    "success": False,
                    "errors": errors,
                    "rows": valid_rows,
                    "total_valid_rows": len(valid_rows)
                }

            return {
                "success": True,
                "errors": [],
                "rows": valid_rows,
                "total_rows": len(valid_rows),
                "total_quantity": total_items,
                "total_estimated_weight_kg": round(total_weight, 2)
            }

        except Exception as e:
            return {"success": False, "errors": [f"Malformed CSV: {str(e)}"], "rows": []}
