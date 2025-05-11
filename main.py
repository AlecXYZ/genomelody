import eel
from gui_controllers import *

"""####################################### Main that starts the application ######################################"""

if __name__ == "__main__":
    # Start application
    try:
        # Initialize temp folder
        init_app()

        # Initialize EEL
        eel.init("web")

        print("Application started.\n")

        # Start the app on homepage (index.html and default mode)
        eel.start("index.html", mode=None, port=8000, host="0.0.0.0")

    # Stop application on window close
    except (SystemExit, KeyboardInterrupt):
        # Clean temporary folder and close app
        quit_app()