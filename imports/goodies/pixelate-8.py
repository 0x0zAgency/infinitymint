import os
from PIL import Image, ImageEnhance

def quantize_image(img, n_colors=32):
    """Quantize the image to a limited number of colors."""
    img = img.convert('P', palette=Image.ADAPTIVE, colors=n_colors).convert('RGB')
    return img

def tint_image(img, tint_factor):
    """Apply tint to the image. -1.0 = black, 1.0 = white."""
    enhancer = ImageEnhance.Color(img)
    if tint_factor < 0:
        img = enhancer.enhance(1 + tint_factor)  # Reduce color
        img = Image.blend(img, Image.new("RGB", img.size, "black"), -tint_factor)
    elif tint_factor > 0:
        img = enhancer.enhance(1 + tint_factor)  # Increase color
        img = Image.blend(img, Image.new("RGB", img.size, "white"), tint_factor)
    return img

def convert_to_8bit(image_path, output_folder, tint_factor):
    # Open the image
    image = Image.open(image_path)
    
    # Reduce resolution to emulate pixelation
    small = image.resize((int(image.width / 8), int(image.height / 8)), resample=Image.BILINEAR)
    
    # Restore to original size
    image = small.resize(image.size, Image.NEAREST)
    
    # Quantize to 8-bit colors
    image = quantize_image(image, 16)  # Using an even more limited palette for 8-bit
    
    # Apply tint
    image = tint_image(image, tint_factor)
    
    # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Save the resulting image as PNG
    filename = os.path.basename(image_path)
    output_path = os.path.join(output_folder, "8bit_" + os.path.splitext(filename)[0] + ".png")
    image.save(output_path, "PNG")
    print(f"Processed {image_path} and saved as {output_path}")

def process_folder(source_folder, output_folder, tint_factor):
    # Get list of all image files in the source folder
    image_files = [f for f in os.listdir(source_folder) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    for img_file in image_files:
        img_path = os.path.join(source_folder, img_file)
        convert_to_8bit(img_path, output_folder, tint_factor)

# Example usage
# Adjust 'source_folder', 'results', and tint_factor as needed.
process_folder('/Users/0xwizardof0z/Documents/GitHub/infinitymint-alpha/imports/goodies/imnotart', '/Users/0xwizardof0z/Documents/GitHub/infinitymint-alpha/imports/goodies/imnotart', 0.2)
