/*################################################## Global functions for frontend ##################################################*/

function navigate_to(page) {
    /*
    Navigate to a different page.
    */
    // Change the current html template
    window.location.href = page;
}

function quit_app() {
    /*
    Quit application and show quit overlay.
    */
    // Get overlay elemnt
    const overlay = document.getElementById("quit-overlay");
    if (overlay) {
        // Remove hidden attribute
        overlay.classList.remove("hidden");
    }

    // Call backend to terminate application
    eel.quit_app();
}

/*---------------------------------------------------------- Piano player -----------------------------------------------------------*/

// Note timing data for highlighting keys
let note_timings = [];
// Active timers for highlighting keys
let active_timers = [];
// The audio player element
let audio_element;
// Start/Stop button is in state playing or stopped
let is_playing = false;

function sync_notes() {
    /*
    Synchronize notes played on the piano with the audio playback. Set timers according to the start time of the notes and duration.
    */
    // Do not synchronize if the note array is empty, no audio element is created or the playback is stopped
    if (!note_timings.length || !audio_element || !is_playing) return;

    // Clear timers to ensure no collisions
    clear_active_timers();

    // Take current time from audio element
    const current_time = audio_element.currentTime * 1000;

    // Check and plan the highlighting for each note
    note_timings.forEach((note) => {
        // Calculate the highlight time from actual moment of playback
        const delay = note.time * 1000 - current_time;

        // Plan only those notes which were not already played
        if (delay >= 0) {
            // Create timer which start function of highlighting
            const highlight_timer = setTimeout(() => {
                highlight_key(note.note);

                // Create timer which start function of unhighlighting
                const unhighlight_timer = setTimeout(() => {
                    remove_highlight(note.note);
                // Duration correction of 100 ms to ensure the unhighlight before next highlight
                }, note.duration * 1000 - 100);

                // Add unhighlight timer to the timer array
                active_timers.push(unhighlight_timer);
            }, delay);

            // Add highlight timer to the timer array
            active_timers.push(highlight_timer);
        }
    });
}

function highlight_key(note) {
    /*
    Highlight key that belongs to note. Add active class to right key.
    */
    const key = document.querySelector(`.key[data-note="${note}"]`);
    if (key) key.classList.add("active");
}

function remove_highlight(note) {
    /*
    Unhighlight key that belongs to note. Remove active class from right key.
    */
    const key = document.querySelector(`.key[data-note="${note}"]`);
    if (key) key.classList.remove("active");
}

function clear_active_timers() {
    /*
    Clear all timers and empty the timers array.
    */
    active_timers.forEach((timer) => clearTimeout(timer));
    active_timers = [];
}

function reset_keys() {
    /*
    Remove active class from all keys.
    */
    document.querySelectorAll(".key").forEach((key) => key.classList.remove("active"));
}

function format_time(seconds) {
    /*
    Format time under playback bar to minutes and seconds.
    */
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    // Add leading zero in front of seconds if less than 10
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function read_file_raw(file) {
    /*
    Read MIDI file in binary form, because MIDI is not human readable format. For further use it needs to be passed to backend.
    */
    // Make promise from filereader to be able to use it with await in the event listener
    return new Promise((resolve, reject) => {
        // Create new filereader
        const reader = new FileReader();
        // On success read give content of file
        reader.onload = () => resolve(reader.result);
        // On unsuccess read give error
        reader.onerror = () => reject(reader.error);
        // Read file as raw binary
        reader.readAsArrayBuffer(file);
    });
}

/*###################################################################################################################################*/
/*######################################################### Event listeners #########################################################*/
/*
Using delegated event handling pattern of event listeners in whole script.js.
*/
// Click event - buttons
document.body.addEventListener("click", async function (event) {
    // Convert button - Synthesizer page
    if (event.target.id === "convert_button") {
        // Get values from form for conversion
        const file_input = document.getElementById('fasta_file');
        const lines_input = document.getElementById('lines_input').value.trim();
        const convert_wav = document.getElementById('convert_wav').checked;
        const algorithm = document.getElementById('algorithm_select').value;
        const bpm = document.getElementById('bpm_select').value;

        // Check if file was inserted
        if (!file_input.files[0]) {
            alert("Please upload a FASTA file.");
            return;
        }
        // Check if the line number is positive non-zero whole number
        if (!/^\d+$/.test(lines_input) || parseInt(lines_input) <= 0) {
            alert("Please enter a valid positive non-zero whole number for lines to read.");
            return;
        }

        // Take file and its name
        const file = file_input.files[0];
        const file_name = file.name;

        // Create new filereader
        const reader = new FileReader();

        // Trigger function after file is read
        reader.onload = async function () {
            // FASTA file is humand readable format - get its content as text
            const fasta_content = reader.result;

            // Call backend processor/adapter to process and convert FASTA file
            const result = await eel.process_fasta_to_music(
                fasta_content,
                parseInt(lines_input),
                convert_wav,
                algorithm,
                parseInt(bpm),
                file_name
            )();

            // Enable download MIDI button and link the path to file to it
            const midi_button = document.getElementById("download_midi");
            midi_button.disabled = false;
            // Append function to button on click
            midi_button.onclick = () => {
                const link = document.createElement('a');
                // Add path to reference
                link.href = result.midi;
                // Name the file as FASTA file
                link.download = `${result.name}.mid`;
                // Click
                link.click();
            };

            // Enable download WAV button and link the path to file to it
            const wav_button = document.getElementById("download_wav");
            if (convert_wav) {
                // Append function to button on click
                wav_button.disabled = false;
                wav_button.onclick = () => {
                    const link = document.createElement('a');
                    // Add path to reference
                    link.href = result.wav;
                    // Name the file as FASTA file
                    link.download = `${result.name}.wav`;
                    // Click
                    link.click();
                };
            }
            // If WAV was not selected - keep button disabled
            else {
                wav_button.disabled = true;
            }
        };
        // Read FASTA file as text
        reader.readAsText(file);
        alert("Conversion completed.");
    }
    // Start/Stop button - Player page
    else if (event.target.id === "play_pause_button") {
        // Take button element
        const play_pause_button = event.target;

        // If is playing - stop the playback
        if (is_playing) {
            // Reset flag
            is_playing = false;
            // Pause audio
            audio_element.pause();
            // Clear highlighting of keys
            clear_active_timers();
            // Change button text
            play_pause_button.textContent = "Start";
        }
        // If is not playing - start the playback
        else {
            // Audio element exists
            if (audio_element) {
                // Reset flag
                is_playing = true;
                // Clear keys highlight
                reset_keys();
                // Synchronize played notes
                sync_notes();
                // Start audio playback
                audio_element.play();
                // Change button text
                play_pause_button.textContent = "Stop";
            }
        }
    }
    // Rewind button - Player page
    else if (event.target.id === "rewind_button") {
        // Audio element exists
        if (audio_element) {
            // Rewind time - jump back 10 seconds or to 0
            audio_element.currentTime = Math.max(audio_element.currentTime - 10, 0);
            // Clear keys highlight
            reset_keys();
            // If playback not stopped
            if (is_playing) {
                // Start highlighting keys
                sync_notes();
            }
        }
    }
    // Forward button - Player page
    else if (event.target.id === "forward_button") {
        // Audio element exists
        if (audio_element) {
            // Forward time - jump forward 10 seconds or to end
            audio_element.currentTime = Math.min(audio_element.currentTime + 10, audio_element.duration);
            // Clear keys highlight
            reset_keys();
            // If playback not stopped
            if (is_playing) {
                // Start highlighting keys
                sync_notes();
            }
        }
    }
});

// Input event - time bar
document.body.addEventListener("input", async function (event) {
    // Time bar - Player page
    if (event.target.id === "progress_bar") {
        // Audio elemnt exists
        if (audio_element) {
            // Update audio element time
            audio_element.currentTime = event.target.value;
            // Reset keys
            reset_keys();
            // If is in state playing
            if (is_playing) {
                // Start highlighting keys
                sync_notes();
            }
        }
    }
});

// Change event - file inputs and algorithm select
document.body.addEventListener("change", async function (event) {
    // Algorithm select - Synthesizer page
    if (event.target.id === "algorithm_select") {
        // Get name of selected algorithm
        const algorithm = event.target.value;
        // Take p element where description is placed
        const description_p = document.querySelector("#synthesizer-description-box p");
        // Not empty variable
        if (description_p) {
            // Get algorithm description from backend
            const description = await eel.get_description(algorithm)();
            // Place it to the p element
            description_p.textContent = description;
        }
    }
    // Upload of MIDI file - Player page
    else if (event.target.id === "midi_file") {
        // Get the file
        const file = event.target.files[0];
        // Not empty variable
        if (file) {
            // Take its name
            const file_name = file.name;
            // Wait for read of MIDI as raw binary file
            const file_content = await read_file_raw(file);
            // Send file as byte array to the backend and get the output notes with timings
            // Raw binary is wrapped to uint8array (bytes) and then to regular array - enable manipulation for backend
            note_timings = await eel.upload_midi(file_name, Array.from(new Uint8Array(file_content)))();
        }
    }
    // Upload of WAV file - Player page
    else if (event.target.id === "wav_file") {
        // Get the file
        const file = event.target.files[0];
        // Not empty variable
        if (file) {
            // Create URL path to WAV file uploaded in browsers memory - no need to save it in backend
            const wav_file = URL.createObjectURL(file);
            // No audio element already created
            if (!audio_element) {
                // Create new audio element
                audio_element = new Audio();

                // Add event listener to load new data
                audio_element.addEventListener("loadedmetadata", () => {
                    // Get time bar element
                    const progress_bar = document.getElementById("progress_bar");
                    // Adjust maximum of time bar to the duration of WAV file
                    progress_bar.max = Math.floor(audio_element.duration);
                    // Get total time display element
                    const total_time_display = document.getElementById("total_time");
                    // Format the time
                    total_time_display.textContent = format_time(audio_element.duration);
                });

                // Add event listener on time update
                audio_element.addEventListener("timeupdate", () => {
                    // Get time bar element
                    const progress_bar = document.getElementById("progress_bar");
                    // Get current time display element
                    const current_time_display = document.getElementById("current_time");
                    // Take selected time on time bar
                    progress_bar.value = Math.floor(audio_element.currentTime);
                    // Format it and display
                    current_time_display.textContent = format_time(audio_element.currentTime);
                });

                // Add event listener on playback end
                audio_element.addEventListener("ended", () => {
                    // When end reset flag
                    is_playing = false;
                    // Rewind to start
                    audio_element.currentTime = 0;
                    // Ensure that highlight timers were cleared
                    clear_active_timers();
                    // Clear highlighted keys
                    reset_keys();
                    
                    // Get button element
                    const play_pause_button = document.getElementById("play_pause_button");
                    if (play_pause_button) {
                        // Update the button text
                        play_pause_button.textContent = "Start";
                    }
                });
            }
            // Add the path to WAV file in borwsers memory to the audio element
            audio_element.src = wav_file;
        }
    }
});