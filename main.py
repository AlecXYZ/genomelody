import eel
import os
import shutil
from mido import MidiFile
from processors import *
from mappings import *
from converters import *

# Constant path where temporary folder will be created
TEMP_FOLDER = "web/temp"

"""############################################ EEL functions for GUI ############################################"""

@eel.expose
def quit_app():
    """
    Terminate the EEL application and delete temporary folder.
    """
    try:
        if os.path.exists(TEMP_FOLDER):
            # Delete folder and its content
            shutil.rmtree(TEMP_FOLDER)

            print(f"Temporary folder '{TEMP_FOLDER}' deleted.")
            print("Application closed.")
    except Exception as e:
        print(f"Error while deleting temporary folder: {e}")

    eel.sleep(1)  # Wait some time to close frontend
    exit(0)  # Terminate application

"""---------------------------------------------Synthesizer functions---------------------------------------------"""

@eel.expose
def process_fasta_to_music(fasta_content, lines_count, convert_to_wav_flag, algorithm, bpm, fasta_name):
    """
    Convert FASTA file to MIDI and optionally WAV using user selected parameters.
    """
    # Extract base name without extension
    base_name = os.path.splitext(fasta_name)[0]
    
    # Set paths using the base name
    midi_path = os.path.join(TEMP_FOLDER, f"{base_name}.mid")
    wav_path = os.path.join(TEMP_FOLDER, f"{base_name}.wav")

    # Select mapping algorithm
    if algorithm == "map_chromatic":
        mapping_algorithm = map_chromatic
    elif algorithm == "map_diatonic":
        mapping_algorithm = map_diatonic

    # Start processor/adapter with selected values from frontend
    process_fasta(
        fasta_content,
        midi_path,
        wav_path if convert_to_wav_flag else None,
        mapping_algorithm,
        create_standard_midi,
        convert_to_wav,
        lines_count,
        bpm)

    print(f"File processed: {fasta_name}\n")

    # Return dictionary with path to MIDI file, optionally WAV file and base name
    return {
        "midi": f"/temp/{base_name}.mid",
        "wav": f"/temp/{base_name}.wav" if convert_to_wav_flag else None,
        "name": base_name}

@eel.expose
def get_description(algorithm):
    """
    Get description of selected algorithm.
    """
    # Select description mathod based on the mapping algorithm
    if algorithm == "map_chromatic":
        descript_algorithm = descript_chromatic
    elif algorithm == "map_diatonic":
        descript_algorithm = descript_diatonic

    # Get string with description
    return descript_algorithm()

"""--------------------------------------------Piano player functions---------------------------------------------"""

@eel.expose
def upload_midi(file_name, file_content):
    """
    Process the uploaded MIDI file and extract notes with its timings and durations.
    """
    try:
        # MIDI file needs to be saved for further processing
        # Path to save MIDI file
        output_path = os.path.join(TEMP_FOLDER, file_name)

        # Write MIDI file to temporary folder - passed to this function as bytearray
        with open(output_path, "wb") as file:
            file.write(bytearray(file_content))

        # Extract notes with its timings and durations
        midi_notes = parse_midi(output_path)

        print(f"File processed: {file_name}\n")

        # Return array of notes with its timings and durations
        return midi_notes
    except Exception as e:
        print(f"Error while processing MIDI file: {e}")
        return []

"""--------------------------------------------Help functions for GUI---------------------------------------------"""

def parse_midi(midi_path):
    """
    Extract a list of notes with timings and durations from MIDI file.
    """
    # Load MIDI file
    midi = MidiFile(midi_path)
    # List with notes and timings
    notes = []
    # Actual playback time
    current_time = 0
    # Dictionary of notes with their start times
    note_on_times = {}

    # Iterate over each note in MIDI file (note on and off message)
    for message in midi:
        # Extract timing of note and add it to global time
        current_time += message.time
        # Note on - record the start time - skip notes that have volume 0
        if message.type == 'note_on' and message.velocity > 0:
            # Wirte note and its start time to the dictionary
            note_on_times[message.note] = current_time

        # Note off - calculate duration
        elif message.type == 'note_off':
            # Check if note started
            if message.note in note_on_times:
                # Get start time and pop the note out of the dictionary
                start_time = note_on_times.pop(message.note)
                # Calculate duration from start time and actual playback time
                duration = current_time - start_time
                # Append note as dictionary with time, note and duration to the list of notes
                notes.append({
                    'time': start_time,
                    'note': midi_note_to_key(message.note),
                    'duration': duration})
    print("Notes with timings:")
    print(notes)
    print()
    # Return the notes with timings to frontend - display it
    return notes

def midi_note_to_key(note_number):
    """
    Get note with octave from MIDI note number.
    """
    # List of note names
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    # Calculate octave
    octave = (note_number // 12) - 1
    # Get note letter from list
    note_name = note_names[note_number % 12]

    # Return string with note name and octave
    return f"{note_name}{octave}"

"""###############################################################################################################"""
"""####################################### Main that starts the application ######################################"""

if __name__ == "__main__":
    # Start application
    try:
        # Create temporary folder
        if not os.path.exists(TEMP_FOLDER):
            os.makedirs(TEMP_FOLDER)
            print(f"Temporary folder '{TEMP_FOLDER}' created.")

        # Initialize EEL
        eel.init('web')
        print("Application started.\n")

        # Start the app on homepage (index.html and default mode)
        eel.start('index.html', mode='default')
    # Stop application on window close
    except (SystemExit, KeyboardInterrupt):
        # Clean temporary folder and close app
        quit_app()