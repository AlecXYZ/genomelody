import eel
from gui_controllers import *

"""####################################### Main that starts the application ######################################"""

if __name__ == "__main__":
    # Start application
    try:
        print("Application started.")

        # Initialize folder for web
        init_folder = init_app()

        # Initialize EEL - start from web folder
        eel.init(init_folder)

        # Start the app on homepage (index.html and edge mode)
        eel.start("index.html", mode="edge")

    # Stop application on window close
    except (SystemExit, KeyboardInterrupt):
        # Clean temporary folder and close app
        quit_app()