# Medicine Images Directory

This directory contains images for medicines used in the prescription system.

## Image Naming Convention
- File names should match the medicine name in lowercase with underscores
- Format: `medicine_name.jpg` or `medicine_name.png`
- Example: `calcium_carbonate.jpg`, `paracetamol.jpg`

## Required Images (from prescription-schema.sql):

### Antibiotics
- `amoxicillin.jpg`
- `azithromycin.jpg`
- `ciprofloxacin.jpg`

### Pain Relief
- `paracetamol.jpg`
- `ibuprofen.jpg`
- `aspirin.jpg`

### Vitamins
- `vitamin_d3.jpg`
- `vitamin_c.jpg`
- `multivitamin.jpg`

### Diabetes
- `metformin.jpg`
- `glipizide.jpg`

### Cardiovascular
- `lisinopril.jpg`
- `amlodipine.jpg`

### Digestive
- `omeprazole.jpg`
- `ranitidine.jpg`
- `aluminum_hydroxide.jpg`
- `calcium_carbonate.jpg`

### Allergy
- `cetirizine.jpg`
- `loratadine.jpg`

### Cough & Cold
- `dextromethorphan.jpg`
- `guaifenesin.jpg`

## Image Requirements
- Recommended size: 200x200px or 300x300px
- Format: JPG or PNG
- Keep file sizes small for web optimization (< 50KB each)

## Usage
These images are referenced in the database with paths like:
`/images/medicines/calcium_carbonate.jpg`

The React frontend will serve these from the public directory automatically.
