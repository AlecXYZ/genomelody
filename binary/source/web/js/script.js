/*################################################## Global functions for frontend ##################################################*/
// Number of lines inside FASTA file
let fasta_total_lines = null;
// Flag to represent valid file
let fasta_valid = true;
// Number of lines inside FASTA file - tutorial
let tutorial_fasta_total_lines = null;
// Flag to represent valid file - tutorial
let tutorial_fasta_valid = true;

// Number of lines and flag for comparator
let fasta_total_nucleotides_1 = null;
let fasta_valid_1 = true;
let fasta_total_nucleotides_2 = null;
let fasta_valid_2 = true;
// Comparison sequences and minimum
let fasta_sequence_1 = "";
let fasta_sequence_2 = "";
let fasta_min_length = null;

function navigate_to(page) {
    /*
    Navigate to a different page.

    Arguments:
        page - Path to page.
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

function show_alert(message) {
    /*
    Print message inside alert overlay.

    Arguments:
        message - String to print.
    */
    // Get overlay element
    const overlay = document.getElementById("alert-overlay");
    const text = document.getElementById("alert-text");

    if (overlay && text) {
        // Make overlay visible and insert text
        text.textContent = message;
        overlay.classList.remove("hidden");
    }
}

function show_loading(message) {
    /*
    Print message inside loading overlay.

    Arguments:
        message - String to print.
    */
    // Get overlay element
    const overlay = document.getElementById("loading-overlay");
    const title = document.getElementById("loading-overlay-title");
    if (overlay && title) {
        // Make overlay visible and insert text
        title.textContent = message;
        overlay.classList.remove("hidden");
    }
}

function hide_loading() {
    /*
    Hide loading overlay.
    */
    // Get overlay element
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
        // Hide overlay
        overlay.classList.add("hidden");
    }
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

    Arguments:
        note - The id of the key - corresponds to the note.
    */
    // Get element
    const key = document.querySelector(`.key[data-note="${note}"]`);
    // Add active class to highlight
    if (key) key.classList.add("active");
}

function remove_highlight(note) {
    /*
    Unhighlight key that belongs to note. Remove active class from right key.
    
    Arguments:
        note - The id of the key - corresponds to the note.
    */
    // Get element
    const key = document.querySelector(`.key[data-note="${note}"]`);
    // Remove active class to unhighlight
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

    Arguments:
        seconds - Time in seconds.
    */
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    // Add leading zero in front of seconds if less than 10
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function read_file_raw(file) {
    /*
    Read MIDI file in binary form, because MIDI is not human readable format. For further use it needs to be passed to backend.

    Arguments:
        file - The MIDI file.
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

/*----------------------------------------------------------- Comparator ------------------------------------------------------------*/
function comparator_analysis() {
    /*
    Compare two FASTA files and find most divergent window of 1000 nucleotides.
    */
    const window_size = 1000;
    let max_diff = -1;
    let best_start = 0;
    let best_end = 1000;

    // Iterate from 0 to the last full window position
    for (let i = 0; i <= fasta_min_length - window_size; i++) {
        let diff_count = 0;
        for (let j = 0; j < window_size; j++) {
            if (fasta_sequence_1[i + j] !== fasta_sequence_2[i + j]) {
                diff_count++;
            }
        }
        // Mark most divergent position
        if (diff_count > max_diff) {
            max_diff = diff_count;
            best_start = i;
        }
    }

    // Adjust for indexing from 1
    best_start = best_start + 1;
    best_end = best_start + window_size - 1;

    // Fill the inputs for user
    document.getElementById("start_nucleotide").value = best_start;
    document.getElementById("stop_nucleotide").value = best_end;
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
        const file_input = document.getElementById("fasta_file");
        const start_line = document.getElementById("start_line").value.trim();
        const stop_line = document.getElementById("stop_line").value.trim();
        const instrument = document.getElementById("instrument_select").value;
        const advanced_bpm = document.getElementById("advanced_bpm_select").value;
        const convert_wav = document.getElementById("advanced_convert_wav").checked;
        const algorithm = document.getElementById("algorithm_select").value;
    
        // Check if file was inserted
        if (!file_input.files[0]) {
            show_alert("Please upload a FASTA file.");
            return;
        }
        // Check if start/stop lines are positive integers
        if (!/^\d+$/.test(start_line) || parseInt(start_line) <= 0) {
            show_alert("Please enter a valid positive whole number for start line.");
            return;
        }
        if (!/^\d+$/.test(stop_line) || parseInt(stop_line) <= 0) {
            show_alert("Please enter a valid positive whole number for stop line.");
            return;
        }
        // Check if start line is smaller then stop line
        if (parseInt(stop_line) <= parseInt(start_line)) {
            show_alert("Stop line must be greater than start line.");
            return;
        }
        // Check if the file contains only valid characters
        if (!fasta_valid) {
            show_alert("The uploaded file contains invalid characters.");
            return;
        }
        // Check if the start/stop line numbers are not bigger than the total number of lines
        if (parseInt(start_line) > fasta_total_lines) {
            show_alert("Start line exceeds total number of lines.");
            return;
        }
        if (parseInt(stop_line) > fasta_total_lines) {
            show_alert("Stop line exceeds total number of lines.");
            return;
        }
    
        // Take file content
        const file = file_input.files[0];
    
        // Create new filereader
        const reader = new FileReader();
    
        // Trigger function after file is read
        reader.onload = async function () {
            // FASTA file is human-readable - get its content as text
            const fasta_content = reader.result;
            
            show_loading("Processing Request");

            // Call backend processor/adapter to process and convert FASTA file
            const result = await eel.process_fasta_to_music(
                fasta_content,
                parseInt(start_line),
                parseInt(stop_line),
                algorithm,
                parseInt(instrument),
                parseInt(advanced_bpm),
                convert_wav
            )();
    
            hide_loading();

            // Enable download MIDI button and link the path to file
            const midi_button = document.getElementById("download_midi");
            midi_button.disabled = false;
            // Append function to button on click
            midi_button.onclick = () => {
                const link = document.createElement("a");
                // Add path to reference
                link.href = result.midi;
                // Name the file with base name
                link.download = `${result.name}.mid`;
                link.click();
            };
    
            // Enable download WAV button if selected
            const wav_button = document.getElementById("download_wav");
            if (convert_wav) {
                // Append function to button on click
                wav_button.disabled = false;
                wav_button.onclick = () => {
                    const link = document.createElement("a");
                    // Add path to reference
                    link.href = result.wav;
                    // Name the file with base name
                    link.download = `${result.name}.wav`;
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
    }
    // Compare button - Comparator page
    else if (event.target.id === "compare_button") {
        // Get values from form
        const file_input_1 = document.getElementById("fasta_file_1");
        const file_input_2 = document.getElementById("fasta_file_2");
        const start_nuc = document.getElementById("start_nucleotide").value.trim();
        const stop_nuc = document.getElementById("stop_nucleotide").value.trim();
        const instrument = document.getElementById("instrument_select").value;
        const advanced_bpm = document.getElementById("advanced_bpm_select").value;
        const convert_wav = document.getElementById("advanced_convert_wav").checked;
        const algorithm = document.getElementById("algorithm_select").value;

        // Check if both files were inserted
        if (!file_input_1.files[0] || !file_input_2.files[0]) {
            show_alert("Please upload both FASTA files.");
            return;
        }
        // Check if start/stop nucleotides are positive integers
        if (!/^\d+$/.test(start_nuc) || parseInt(start_nuc) <= 0) {
            show_alert("Please enter a valid positive whole number for start nucleotide.");
            return;
        }
        if (!/^\d+$/.test(stop_nuc) || parseInt(stop_nuc) <= 0) {
            show_alert("Please enter a valid positive whole number for stop nucleotide.");
            return;
        }
        // Check if start nucleotide is smaller then stop nucleotide
        if (parseInt(stop_nuc) <= parseInt(start_nuc)) {
            show_alert("Stop nucleotide must be greater than start nucleotide.");
            return;
        }
        // Check if the files contains only valid characters
        if (!fasta_valid_1 || !fasta_valid_2 || !fasta_sequence_1 || !fasta_sequence_2) {
            show_alert("One of the uploaded files contains invalid characters.");
            return;
        }
        // Check if the start/stop nucleotide numbers are not bigger than the total number of lines
        if (parseInt(stop_nuc) > fasta_total_nucleotides_1 || parseInt(stop_nuc) > fasta_total_nucleotides_2) {
            show_alert("Stop nucleotide exceeds total number of lines in one of the files.");
            return;
        }

        show_loading("Processing Request");

        // Call backend processor/adapter to process and convert FASTA files
        const result = await eel.process_double_fasta_to_music(
            fasta_sequence_1,
            fasta_sequence_2,
            parseInt(start_nuc),
            parseInt(stop_nuc),
            algorithm,
            parseInt(instrument),
            parseInt(advanced_bpm),
            convert_wav
        )();

        hide_loading();

        // Enable download MIDI button and link the path to file
        const midi_button = document.getElementById("download_midi");
        midi_button.disabled = false;
        midi_button.onclick = () => {
            const link = document.createElement("a");
            link.href = result.midi;
            link.download = `${result.name}.mid`;
            link.click();
        };
        // Enable download WAV button if selected
        const wav_button = document.getElementById("download_wav");
        if (convert_wav) {
            wav_button.disabled = false;
            wav_button.onclick = () => {
                const link = document.createElement("a");
                link.href = result.wav;
                link.download = `${result.name}.wav`;
                link.click();
            };
        }
        // If WAV was not selected - keep button disabled
        else {
            wav_button.disabled = true;
        }
    }
    // First next tutorial button - Tutorial page
    else if (event.target.id === "first_next_button") {
        // Get values
        const file_input = document.getElementById("tutorial_fasta_file");
        const start_line = document.getElementById("tutorial_start_line").value.trim();
        const stop_line = document.getElementById("tutorial_stop_line").value.trim();
        
        // Check if file was inserted
        if (!file_input.files[0]) {
            show_alert("Please upload a FASTA file.");
            return;
        }
        // Check if start/stop lines are positive integers
        if (!/^\d+$/.test(start_line) || parseInt(start_line) <= 0) {
            show_alert("Please enter a valid positive whole number for start line.");
            return;
        }
        if (!/^\d+$/.test(stop_line) || parseInt(stop_line) <= 0) {
            show_alert("Please enter a valid positive whole number for stop line.");
            return;
        }
        // Check if start line is smaller then stop line
        if (parseInt(stop_line) <= parseInt(start_line)) {
            show_alert("Stop line must be greater than start line.");
            return;
        }
        // Check if the file contains only valid characters
        if (!tutorial_fasta_valid) {
            show_alert("The uploaded file contains invalid characters.");
            return;
        }
        // Check if the start/stop line numbers are not bigger than the total number of lines
        if (parseInt(start_line) > tutorial_fasta_total_lines) {
            show_alert("Start line exceeds total number of lines.");
            return;
        }
        if (parseInt(stop_line) > tutorial_fasta_total_lines) {
            show_alert("Stop line exceeds total number of lines.");
            return;
        }
        // Move on next page - unhide it
        document.getElementById("first-tutorial-container").classList.add("hidden");
        document.getElementById("second-tutorial-container").classList.remove("hidden");
    }
    // Second back tutorial button - Tutorial page
    else if (event.target.id === "second_back_button") {
        // Move on previous page - unhide it
        document.getElementById("second-tutorial-container").classList.add("hidden");
        document.getElementById("first-tutorial-container").classList.remove("hidden");
    }
    // Second next tutorial button - Tutorial page
    else if (event.target.id === "second_next_button") {
        // Get values
        const file_input = document.getElementById("tutorial_fasta_file");
        const start_line = document.getElementById("tutorial_start_line").value.trim();
        const stop_line = document.getElementById("tutorial_stop_line").value.trim();
        const instrument = document.getElementById("tutorial_instrument_select").value;
        const algorithm = document.getElementById("tutorial_algorithm_select").value;
        const bpm = document.getElementById("tutorial_bpm_select").value;
    

        // Check if file was inserted
        if (!file_input.files[0]) {
            show_alert("Please upload a FASTA file.");
            return;
        }
        // Check if start/stop lines are positive integers
        if (!/^\d+$/.test(start_line) || parseInt(start_line) <= 0) {
            show_alert("Please enter a valid positive whole number for start line.");
            return;
        }
        if (!/^\d+$/.test(stop_line) || parseInt(stop_line) <= 0) {
            show_alert("Please enter a valid positive whole number for stop line.");
            return;
        }
        // Check if start line is smaller then stop line
        if (parseInt(stop_line) <= parseInt(start_line)) {
            show_alert("Stop line must be greater than start line.");
            return;
        }
        // Check if the file contains only valid characters
        if (!tutorial_fasta_valid) {
            show_alert("The uploaded file contains invalid characters.");
            return;
        }
        // Check if the start/stop line numbers are not bigger than the total number of lines
        if (parseInt(start_line) > tutorial_fasta_total_lines) {
            show_alert("Start line exceeds total number of lines.");
            return;
        }
        if (parseInt(stop_line) > tutorial_fasta_total_lines) {
            show_alert("Stop line exceeds total number of lines.");
            return;
        }

        // Take file content
        const file = file_input.files[0];

        // Create new filereader
        const reader = new FileReader();

        // Trigger function after file is read
        reader.onload = async function () {
            // FASTA file is human-readable - get its content as text
            const fasta_content = reader.result;
    
            show_loading("Processing Request");

            // Call backend processor/adapter to process and convert FASTA file
            const result = await eel.process_fasta_to_music(
                fasta_content,
                parseInt(start_line),
                parseInt(stop_line),
                algorithm,
                parseInt(instrument),
                parseInt(bpm),
                true // Always convert to WAV in tutorial
            )();

            hide_loading();
    
            // Enable download MIDI button and link the path to file
            const midi_button = document.getElementById("tutorial_download_midi");
            midi_button.disabled = false;
            midi_button.onclick = () => {
                const link = document.createElement("a");
                link.href = result.midi;
                link.download = `${result.name}.mid`;
                link.click();
            };
            // Enable download WAV button if selected
            const wav_button = document.getElementById("tutorial_download_wav");
            wav_button.disabled = false;
            wav_button.onclick = () => {
                const link = document.createElement("a");
                link.href = result.wav;
                link.download = `${result.name}.wav`;
                link.click();
            };
    
            // Fill summary table with picked values
            document.getElementById("summary-instrument").textContent = document.getElementById("tutorial_instrument_select").selectedOptions[0].text;
            document.getElementById("summary-algorithm").textContent = document.getElementById("tutorial_algorithm_select").selectedOptions[0].text;
            document.getElementById("summary-bpm").textContent = bpm;
            document.getElementById("summary-start").textContent = start_line;
            document.getElementById("summary-stop").textContent = stop_line;
            document.getElementById("summary-file").textContent = file.name;
    
            // Move on next page - unhide it
            document.getElementById("second-tutorial-container").classList.add("hidden");
            document.getElementById("third-tutorial-container").classList.remove("hidden");
        };
        reader.readAsText(file);
    }
    // Third back tutorial button - Tutorial page
    else if (event.target.id === "third_back_button") {
        // Move on previous page - unhide it
        document.getElementById("third-tutorial-container").classList.add("hidden");
        document.getElementById("second-tutorial-container").classList.remove("hidden");
    }
    // Third next tutorial button - Tutorial page
    else if (event.target.id === "third_next_button") {
        // Move on next page - unhide it
        document.getElementById("third-tutorial-container").classList.add("hidden");
        document.getElementById("fourth-tutorial-container").classList.remove("hidden");
    }
    // Fourth back tutorial button - Tutorial page
    else if (event.target.id === "fourth_back_button") {
        // Move on previous page - unhide it
        document.getElementById("fourth-tutorial-container").classList.add("hidden");
        document.getElementById("third-tutorial-container").classList.remove("hidden");

        // Stop audio playback - if active
        if (audio_element && is_playing) {
            audio_element.pause();
            audio_element.currentTime = 0;
            is_playing = false;

            // Reset piano highlights and timers
            clear_active_timers();
            reset_keys();

            // Reset button text
            const play_pause_button = document.getElementById("play_pause_button");
            if (play_pause_button) {
                play_pause_button.textContent = "Start";
            }
        }
    }
    // Close alert overlay
    else if (event.target.id === "alert_ok_button") {
        const overlay = document.getElementById("alert-overlay");
        if (overlay) {
            overlay.classList.add("hidden");
        }
    }
    // Open advanced settings overlay
    else if (event.target.id === "advanced_settings") {
        const advanced_overlay = document.getElementById("advanced-overlay");
        if (advanced_overlay) {
            advanced_overlay.classList.remove("hidden");
        }
    }
    // Close advanced settings overlay
    else if (event.target.id === "advanced_ok_button") {
        const advanced_overlay = document.getElementById("advanced-overlay");
        if (advanced_overlay) {
            advanced_overlay.classList.add("hidden");
        }
    }
    // Open file info overlay
    else if (event.target.id === "file_info") {
        const fileinfo_overlay = document.getElementById("fileinfo-overlay");
        if (fileinfo_overlay) {
            fileinfo_overlay.classList.remove("hidden");
        }
    }
    // Close file info overlay
    else if (event.target.id === "fileinfo_ok_button") {
        const fileinfo_overlay = document.getElementById("fileinfo-overlay");
        if (fileinfo_overlay) {
            fileinfo_overlay.classList.add("hidden");
        }
    }
    // Open mapping detail overlay
    else if (event.target.id === "show_details") {
        const mapping_overlay = document.getElementById("mapping-overlay");
        if (mapping_overlay) {
            mapping_overlay.classList.remove("hidden");
        }
    }
    // Close mapping detail overlay
    else if (event.target.id === "mapping_ok_button") {
        const mapping_overlay = document.getElementById("mapping-overlay");
        if (mapping_overlay) {
            mapping_overlay.classList.add("hidden");
        }
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
        // Audio element exists
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
        const description_p = document.querySelector("#description-box p");
        // Not empty variable
        if (description_p) {
            // Get algorithm description from backend
            const description = await eel.get_description(algorithm)();
            // Place it to the p element
            description_p.textContent = description;
        }

        // Get and apply mapping to the overlay
        const mapping = await eel.get_algorithm_mapping(algorithm)();
        const mapping_table = document.getElementById("mapping-table");
        if (mapping_table) {
            // Clear old
            mapping_table.innerHTML = "";

            // For each key and value create new divs
            for (const [key, value] of Object.entries(mapping)) {
                const row = document.createElement("div");
                row.className = "mapping-row";
                row.innerHTML = 
                    `
                    <div class="mapping-key">${key}</div>
                    <div class="mapping-transition">>>></div>
                    <div class="mapping-value">${value}</div>
                    `;
                mapping_table.appendChild(row);
            }
        }
    }
    // Algorithm select - Tutorial page
    else if (event.target.id === "tutorial_algorithm_select") {
        // Get name of selected algorithm
        const algorithm = event.target.value;
    
        // Update algorithm description
        const description_p = document.getElementById("tutorial-algorithm-description");
        if (description_p) {
            const description = await eel.get_description(algorithm)();
            description_p.textContent = description;
        }
    
        // Get and apply mapping to the table
        const mapping = await eel.get_algorithm_mapping(algorithm)();
        const mapping_table = document.getElementById("tutorial-mapping-table");
        if (mapping_table) {
            // Clear old
            mapping_table.innerHTML = "";
    
            // For each key and value create new divs
            for (const [key, value] of Object.entries(mapping)) {
                const row = document.createElement("div");
                row.className = "tutorial-mapping-row";
                row.innerHTML = 
                    `
                    <div class="tutorial-mapping-key">${key}</div>
                    <div class="tutorial-mapping-transition">>>></div>
                    <div class="tutorial-mapping-value">${value}</div>
                    `;
                mapping_table.appendChild(row);
            }
        }
    }
    // FASTA file upload - Synthesizer page
    else if (event.target.id === "fasta_file") {
        const file = event.target.files[0];

        // If no file uploaded file - reset all fields
        if (!file) {
            document.getElementById("fileinfo-name").textContent = "-";
            document.getElementById("fileinfo-size").textContent = "-";
            document.getElementById("fileinfo-lines").textContent = "-";
            document.getElementById("fileinfo-nucleotides").textContent = "-";
            document.getElementById("fileinfo-sample").textContent = "-";
            fasta_total_lines = null;
            return;
        }

        // Fill file name and size
        document.getElementById("fileinfo-name").textContent = file.name;
        document.getElementById("fileinfo-size").textContent = (file.size / 1024).toFixed(2) + " KB";

        // Read and process content
        const reader = new FileReader();
        reader.onload = function () {
            const content = reader.result;

            // Extract lines of nucleotides - excluding headers and empty lines
            const lines = content.split(/\r\n|\r|\n/).filter(line => line.trim() !== "" && !line.startsWith(">"));
            // Fill number of lines
            document.getElementById("fileinfo-lines").textContent = lines.length;
            // Store the number of lines
            fasta_total_lines = lines.length;

            // Count nucleotides - characters that match A, C, T, G
            const nucleotides = content.match(/[ACTGactg]/g) || [];
            // Fill number of nucleotides
            document.getElementById("fileinfo-nucleotides").textContent = nucleotides.length;

            // Make sample of first 10 characters
            let sample_text = "-";
            if (lines.length > 0) {
                sample_text = lines[0].slice(0, 10);
            }
            // Fill sample
            document.getElementById("fileinfo-sample").textContent = sample_text;

            // Check for invalid characters
            const joined_sequence = lines.join("").toUpperCase();
            const invalid_characters = joined_sequence.match(/[^ACTG]/g);

            // Alert if the file contains invalid character
            if (invalid_characters) {
                show_alert("Invalid characters found in the file.");
                fasta_total_lines = null;
                fasta_valid = false;
                return;
            }
            else {
                fasta_valid = true;
            }
        };
        reader.readAsText(file);
    }
    // FASTA file upload - Comparator page - First file
    else if (event.target.id === "fasta_file_1") {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function () {
                const content = reader.result;

                // Extract lines of nucleotides - excluding headers and empty lines
                const lines = content.split(/\r\n|\r|\n/).filter(line => line.trim() !== "" && !line.startsWith(">"));

                // Count nucleotides - characters that match A, C, T, G - if non there, return empty array
                const nucleotides = content.match(/[ACTGactg]/g) || [];

                // Check for invalid characters
                const joined_sequence = lines.join("").toUpperCase();
                const invalid_characters = joined_sequence.match(/[^ACTG]/g);

                // Fill elements with gained values
                document.getElementById("fileinfo-name-1").textContent = file.name;
                document.getElementById("fileinfo-size-1").textContent = (file.size / 1024).toFixed(2) + " KB";
                document.getElementById("fileinfo-lines-1").textContent = lines.length;
                document.getElementById("fileinfo-nucleotides-1").textContent = nucleotides.length;

                // Make sample of first 10 characters
                let sample_text = "-";
                if (lines.length > 0) {
                    sample_text = lines[0].slice(0, 10);
                }
                document.getElementById("fileinfo-sample-1").textContent = sample_text;

                // Alert if the file contains invalid character
                if (invalid_characters) {
                    show_alert("Invalid characters found in the first file.");
                    fasta_total_nucleotides_1 = null;
                    fasta_valid_1 = false;
                    return;
                }
                else {
                    // Append preprocessed sequence to variable
                    fasta_sequence_1 = joined_sequence;
                    fasta_total_nucleotides_1 = nucleotides.length;
                    fasta_valid_1 = true;

                    // If both fales are loaded - perform comparison
                    if (fasta_valid_2 && fasta_sequence_2) {
                        fasta_min_length = Math.min(fasta_sequence_1.length, fasta_sequence_2.length);
                        comparator_analysis();
                    }
                }
            };
            reader.readAsText(file);
        }
    }
    // FASTA file upload - Comparator page - Second File
    else if (event.target.id === "fasta_file_2") {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function () {
                const content = reader.result;
                
                // Extract lines of nucleotides - excluding headers and empty lines
                const lines = content.split(/\r\n|\r|\n/).filter(line => line.trim() !== "" && !line.startsWith(">"));

                // Count nucleotides - characters that match A, C, T, G - if non there, return empty array
                const nucleotides = content.match(/[ACTGactg]/g) || [];

                // Check for invalid characters
                const joined_sequence = lines.join("").toUpperCase();
                const invalid_characters = joined_sequence.match(/[^ACTG]/g);

                // Fill elements with gained values
                document.getElementById("fileinfo-name-2").textContent = file.name;
                document.getElementById("fileinfo-size-2").textContent = (file.size / 1024).toFixed(2) + " KB";
                document.getElementById("fileinfo-lines-2").textContent = lines.length;
                document.getElementById("fileinfo-nucleotides-2").textContent = nucleotides.length;

                // Make sample of first 10 characters
                let sample_text = "-";
                if (lines.length > 0) {
                    sample_text = lines[0].slice(0, 10);
                }
                document.getElementById("fileinfo-sample-2").textContent = sample_text;

                // Alert if the file contains invalid character
                if (invalid_characters) {
                    show_alert("Invalid characters found in the second file.");
                    fasta_total_nucleotides_2 = null;
                    fasta_valid_2 = false;
                    return;
                }
                else {
                    // Append preprocessed sequence to variable
                    fasta_sequence_2 = joined_sequence;
                    fasta_total_nucleotides_2 = nucleotides.length;
                    fasta_valid_2 = true;

                    // If both fales are loaded - perform comparison
                    if (fasta_valid_1 && fasta_sequence_1) {
                        fasta_min_length = Math.min(fasta_sequence_1.length, fasta_sequence_2.length);
                        comparator_analysis();
                    }
                }
            };
            reader.readAsText(file);
        }
    }
    // FASTA file upload - Tutorial page
    else if (event.target.id === "tutorial_fasta_file") {
        const file = event.target.files[0];
    
        // If no file uploaded file - reset all fields
        if (!file) {
            document.getElementById("tutorial-file-name").textContent = "-";
            document.getElementById("tutorial-file-size").textContent = "-";
            document.getElementById("tutorial-file-lines").textContent = "-";
            document.getElementById("tutorial-file-nucleotides").textContent = "-";
            document.getElementById("tutorial-file-sample").textContent = "-";
            tutorial_fasta_total_lines = null;
            return;
        }
    
        // Fill file name and size
        document.getElementById("tutorial-file-name").textContent = file.name;
        document.getElementById("tutorial-file-size").textContent = (file.size / 1024).toFixed(2) + " KB";
        
        // Read and process content
        const reader = new FileReader();
        reader.onload = function () {
            const content = reader.result;
            
            // Extract lines of nucleotides - excluding headers and empty lines
            const lines = content.split(/\r\n|\r|\n/).filter(line => line.trim() !== "" && !line.startsWith(">"));
            // Fill number of lines
            document.getElementById("tutorial-file-lines").textContent = lines.length;
            // Store the number of lines
            tutorial_fasta_total_lines = lines.length;
    
            // Count nucleotides - characters that match A, C, T, G
            const nucleotides = content.match(/[ACTGactg]/g) || [];
            // Fill number of nucleotides
            document.getElementById("tutorial-file-nucleotides").textContent = nucleotides.length;
    
            // Make sample of first 10 characters
            let sample_text = "-";
            if (lines.length > 0) {
                sample_text = lines[0].slice(0, 10);
            }
            // Fill sample
            document.getElementById("tutorial-file-sample").textContent = sample_text;
    
            // Check for invalid characters
            const joined_sequence = lines.join("").toUpperCase();
            const invalid_characters = joined_sequence.match(/[^ACTG]/g);

            // Alert if the file contains invalid character
            if (invalid_characters) {
                show_alert("Invalid characters found in the file.");
                tutorial_fasta_total_lines = null;
                tutorial_fasta_valid = false;
                return;
            }
            else {
                tutorial_fasta_valid = true;
            }
        };
        reader.readAsText(file);
    }
    // Upload of MIDI file - Player page
    else if (event.target.id === "midi_file") {
        // Get the file
        const file = event.target.files[0];
        // Not empty variable
        if (file) {
            // Wait for read of MIDI as raw binary file
            const file_content = await read_file_raw(file);
            // Send file as byte array to the backend and get the output notes with timings
            // Raw binary is wrapped to uint8array (bytes) and then to regular array - enable manipulation for backend
            note_timings = await eel.upload_midi(Array.from(new Uint8Array(file_content)))();
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