import os
import re

def add_edit_mode_script_to_html():
    """
    Adds the edit-mode-utils.js script to all HTML files in the current directory
    that don't already have it.
    """
    # Get all HTML files in the current directory
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    
    # Script tag to add
    script_tag = '<script src="edit-mode-utils.js"></script>'
    
    for file_name in html_files:
        # Skip backup files
        if file_name.startswith('backup_'):
            continue
        
        # Try different encodings
        encodings = ['utf-8', 'latin1', 'cp1251']
        content = None
        
        for encoding in encodings:
            try:
                with open(file_name, 'r', encoding=encoding) as file:
                    content = file.read()
                break  # If successful, break the loop
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print(f"Could not read {file_name} with any encoding, skipping...")
            continue
            
        # Check if the script is already included
        if 'edit-mode-utils.js' in content:
            print(f"Script already in {file_name}, skipping...")
            continue
            
        # Find a good place to insert the script - after config.js or before </body>
        if '<script src="config.js"></script>' in content:
            # Insert after config.js
            new_content = content.replace(
                '<script src="config.js"></script>',
                '<script src="config.js"></script>\n' + script_tag
            )
        else:
            # Insert before </body>
            new_content = content.replace('</body>', script_tag + '\n</body>')
            
        # Write the modified content back using the successful encoding
        successful_encoding = None
        for encoding in encodings:
            try:
                with open(file_name, 'r', encoding=encoding) as file:
                    _ = file.read()
                successful_encoding = encoding
                break
            except UnicodeDecodeError:
                continue
        
        if successful_encoding:
            with open(file_name, 'w', encoding=successful_encoding) as file:
                file.write(new_content)
            print(f"Added edit mode script to {file_name} using {successful_encoding}")
        else:
            print(f"Could not determine encoding for {file_name}, skipping...")

if __name__ == "__main__":
    add_edit_mode_script_to_html()
    print("Done!")
