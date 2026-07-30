from PIL import Image

def convert_additive_to_alpha(img_path, out_path):
    print("Opening image...")
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        max_val = max(r, g, b)
        
        # If it's very dark, just make it completely transparent
        if max_val < 5:
            new_data.append((0, 0, 0, 0))
        else:
            alpha = max_val
            alpha_f = alpha / 255.0
            
            # Un-multiply the RGB by the new alpha to restore the vibrant color
            new_r = min(255, int(r / alpha_f))
            new_g = min(255, int(g / alpha_f))
            new_b = min(255, int(b / alpha_f))
            
            # The background of the user's JPG might not be perfectly black, but a dark blue.
            # Let's apply a slight curve to crush the blacks to avoid the "shadow box"
            if alpha < 20:
                # Fade out near-black pixels aggressively
                alpha = int(alpha * (alpha / 20.0))
            
            new_data.append((new_r, new_g, new_b, alpha))
            
    print("Saving transparent PNG...")
    img.putdata(new_data)
    
    # We should also crop the massive transparent padding to make the image easier to handle in CSS!
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, "PNG")
    print("Done!")

convert_additive_to_alpha('public/logo.jpg', 'public/logo.png')
