document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    const prompt = document.getElementById('prompt');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');
    const colorOptions = document.querySelectorAll('.color-option[data-color]');
    const bgOptions = document.querySelectorAll('.color-option[data-bg]');
    const fontSizeSelect = document.getElementById('font-size');
    const terminalContainer = document.getElementById('terminal-container');
    
    // Terminal state
    let commandHistory = [];
    let historyIndex = -1;
    let currentTheme = 'cyan';
    
    // Available commands
    function saveFS() {
    localStorage.setItem('virtualFS', JSON.stringify(virtualFS));
}

    const commands = {
      rm: {
    description: 'Delete a file: rm <filename>',
    execute: (args) => {
        if (args.length === 0) {
            addOutput('Usage: rm <filename>', true);
            return;
        }
        const filename = args[0];
        if (virtualFS[filename] !== undefined) {
            delete virtualFS[filename];
            saveFS();
            addOutput(`File '${filename}' deleted.`);
        } else {
            addOutput(`File '${filename}' not found.`, true);
        }
    }
},
clearfs: {
    description: "Clear all saved files",
    execute: () => {
        if (confirm("Are you sure you want to delete all files?")) {
            for (const key in virtualFS) delete virtualFS[key];
            localStorage.removeItem('virtualFS');
            addOutput("Virtual filesystem cleared.");
        }
    }
},
mv: {
    description: "Rename a file: mv <old-filename> <new-filename>",
    execute: (args) => {
        if (args.length !== 2) {
            addOutput("Usage: mv <old-filename> <new-filename>", true);
            return;
        }

        const [oldName, newName] = args;

        if (!virtualFS.hasOwnProperty(oldName)) {
            addOutput(`File '${oldName}' not found.`, true);
            return;
        }

        if (virtualFS.hasOwnProperty(newName)) {
            addOutput(`File '${newName}' already exists.`, true);
            return;
        }

        virtualFS[newName] = virtualFS[oldName];
        delete virtualFS[oldName];
        saveFS();
        addOutput(`Renamed '${oldName}' to '${newName}'.`);
    }
},
run: {
    description: 'Run JavaScript: run <code>',
    execute: (args) => {
        const code = args.join(' ');
        try {
            const result = Function('"use strict";return (' + code + ')')();
            addOutput(`Result: ${result}`);
        } catch (e) {
            addOutput(`Error: ${e}`, true);
        }
    }
},
      export: {
    description: 'Export a file: export <filename>',
    execute: (args) => {
        if (args.length === 0) {
            addOutput('Usage: export <filename>', true);
            return;
        }
        const filename = args[0];
        if (virtualFS[filename] === undefined) {
            addOutput(`File '${filename}' not found.`, true);
            return;
        }

        const blob = new Blob([virtualFS[filename]], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);

        addOutput(`File '${filename}' downloaded.`);
    }
},
import: {
    description: 'Import a local file into the virtual filesystem',
    execute: () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.md,.json,.js,.html,.css';

        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (!file) {
                addOutput('No file selected.', true);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                virtualFS[file.name] = e.target.result;
                addOutput(`File '${file.name}' imported.`);
                localStorage.setItem('virtualFS', JSON.stringify(virtualFS));
                saveFS();
            };
            reader.onerror = () => {
                addOutput(`Failed to read file '${file.name}'.`, true);
            };
            reader.readAsText(file);
        };

        fileInput.click();
    }
},
        help: {
            description: 'Show available commands',
            execute: () => {
                addOutput('Available commands:');
                Object.keys(commands).forEach(cmd => {
                    addOutput(`<span class="text-${currentTheme}-400">${cmd}</span> - ${commands[cmd].description}`);
                });
            }
        },
        clear: {
            description: 'Clear the terminal',
            execute: () => {
                terminalOutput.innerHTML = '';
            }
        },
        echo: {
            description: 'Echo the input',
            execute: (args) => {
                addOutput(args.join(' '));
            }
        },
        theme: {
            description: 'Change terminal theme color',
            execute: (args) => {
                if (args.length === 0) {
                    addOutput(`Current theme: ${currentTheme}`);
                    addOutput('Available themes: cyan, green, purple, red, yellow');
                    return;
                }
                
                const newTheme = args[0].toLowerCase();
                if (['cyan', 'green', 'purple', 'red', 'yellow'].includes(newTheme)) {
                    currentTheme = newTheme;
                    updateTheme();
                    addOutput(`Theme changed to ${newTheme}`);
                } else {
                    addOutput(`Invalid theme: ${newTheme}. Available themes: cyan, green, purple, red, yellow`);
                }
            }
        },
        date: {
            description: 'Show current date and time',
            execute: () => {
                addOutput(new Date().toString());
            }
        },
        about: {
            description: 'About this terminal',
            execute: () => {
                addOutput('Web Terminal v1.0');
                addOutput('A customizable terminal emulator for the web');
                addOutput('Built with HTML, CSS, and JavaScript');
            }
        },
        resize: {
            description: 'Simulate terminal resize',
            execute: () => {
                addOutput('Terminal resized');
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            }
        },
        ls: {
            description: 'List files in the virtual filesystem',
            execute: () => {
                const files = Object.keys(virtualFS);
                if (files.length === 0) {
                    addOutput('No files found.');
                } else {
                    addOutput(files.join('  '));
                }
            }
        },
        touch: {
            description: 'Create a new file: touch <filename>',
            execute: (args) => {
                if (args.length === 0) {
                    addOutput('Usage: touch <filename>', true);
                    return;
                }
                const filename = args[0];
                if (virtualFS[filename]) {
                    addOutput(`File '${filename}' already exists.`, true);
                } else {
                    virtualFS[filename] = '';
                    addOutput(`File '${filename}' created.`);
                    saveFS();
                }
            }
        },
        cat: {
            description: 'Show file contents: cat <filename>',
            execute: (args) => {
                if (args.length === 0) {
                    addOutput('Usage: cat <filename>', true);
                    return;
                }
                const filename = args[0];
                if (virtualFS[filename] !== undefined) {
                    addOutput(`<pre>${escapeHTML(virtualFS[filename])}</pre>`);
                } else {
                    addOutput(`File '${filename}' not found.`, true);
                }
            }
        },
        edit: {
            description: 'Edit a file: edit <filename>',
            execute: (args) => {
                if (args.length === 0) {
                    addOutput('Usage: edit <filename>', true);
                    return;
                }
                const filename = args[0];
                if (virtualFS[filename] === undefined) {
                    addOutput(`File '${filename}' not found.`, true);
                    return;
                }
                // Open a simple modal for editing
                openEditorModal(filename, virtualFS[filename]);
            }
        }
    };
    
    // Virtual filesystem (in-memory)
    const virtualFS = JSON.parse(localStorage.getItem('virtualFS')) || {};

    // Helper to escape HTML for safe display
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(tag) {
            const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return charsToReplace[tag] || tag;
        });
    }

    // Modal editor for file editing
    function openEditorModal(filename, content) {
        // Remove existing modal if present
        const oldModal = document.getElementById('editor-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = 'editor-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';

        modal.innerHTML = `
            <div style="background:#1e293b;padding:32px 32px 24px 32px;border-radius:16px;min-width:480px;max-width:900px;width:60vw;max-height:80vh;display:flex;flex-direction:column;gap:16px;">
                <div style="font-weight:bold;color:#38bdf8;font-size:1.2rem;">Editing: ${escapeHTML(filename)}</div>
                <textarea id="editor-textarea" style="width:100%;height:350px;resize:vertical;background:#0f172a;color:#fff;border-radius:8px;padding:12px;font-size:1rem;border:none;">${escapeHTML(content)}</textarea>
                <div style="display:flex;gap:12px;justify-content:flex-end;">
                    <button id="editor-save" style="background:#38bdf8;color:#fff;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;font-size:1rem;">Save</button>
                    <button id="editor-cancel" style="background:#64748b;color:#fff;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;font-size:1rem;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('editor-save').onclick = function() {
            const newContent = document.getElementById('editor-textarea').value;
            virtualFS[filename] = newContent;
            addOutput(`File '${filename}' updated.`);
            modal.remove();
            saveFS();
            
        };
        document.getElementById('editor-cancel').onclick = function() {
            addOutput('Edit cancelled.');
            modal.remove();
        };
    }

    // Initialize terminal
    function initTerminal() {
        // Load settings from localStorage if available
        const savedTheme = localStorage.getItem('terminalTheme');
        const savedBg = localStorage.getItem('terminalBg');
        const savedFontSize = localStorage.getItem('terminalFontSize');
        
        if (savedTheme) {
            currentTheme = savedTheme;
            updateTheme();
        }
        
        if (savedBg) {
            terminalContainer.classList.remove('bg-gray-800');
            terminalContainer.classList.add(`bg-${savedBg}`);
            document.querySelector(`.color-option[data-bg="${savedBg}"]`).classList.add('active');
        }
        
        if (savedFontSize) {
            terminalOutput.classList.remove('text-sm', 'text-base', 'text-lg');
            terminalOutput.classList.add(`text-${savedFontSize}`);
            fontSizeSelect.value = savedFontSize;
        }
        
        // Focus input on any click in the terminal
        terminalContainer.addEventListener('click', () => {
            terminalInput.focus();
        });
        
        // Initial scroll to bottom
        scrollToBottom();
    }
    
    // Add output to terminal
    function addOutput(text, isError = false) {
        const outputLine = document.createElement('div');
        if (isError) {
            outputLine.className = `text-red-400`;
        }
        outputLine.innerHTML = text;
        terminalOutput.appendChild(outputLine);
        scrollToBottom();
    }
    
    // Scroll to bottom of terminal
    function scrollToBottom() {
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
    
    // Process command
    function processCommand(input) {
        if (!input.trim()) return;
        
        // Add command to history
        commandHistory.push(input);
        historyIndex = commandHistory.length;
        
        // Display command in terminal
        addOutput(`<span class="text-${currentTheme}-400">${prompt.textContent}</span> ${input}`);
        
        // Parse command
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Execute command
        if (commands[command]) {
            try {
                commands[command].execute(args);
            } catch (error) {
                addOutput(`Error executing command: ${error}`, true);
            }
        } else {
            addOutput(`Command not found: ${command}. Type 'help' for available commands.`, true);
        }
        
        // Ensure we're scrolled to bottom after command execution
        setTimeout(scrollToBottom, 10);
    }
    
    // Update theme colors
    function updateTheme() {
        prompt.className = `text-${currentTheme}-400 mr-2`;
        
        // Update active color option
        colorOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.color === currentTheme) {
                option.classList.add('active');
            }
        });
        
        // Save to localStorage
        localStorage.setItem('terminalTheme', currentTheme);
    }
    
    // Event Listeners
    terminalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            processCommand(terminalInput.value);
            terminalInput.value = '';
        } else if (e.key === 'ArrowUp') {
            // Command history navigation
            if (commandHistory.length > 0) {
                if (historyIndex > 0) {
                    historyIndex--;
                }
                terminalInput.value = commandHistory[historyIndex] || '';
                e.preventDefault();
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex] || '';
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
            e.preventDefault();
        }
    });
    
    // Settings panel
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
    });
    
    // Color theme selection
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            currentTheme = option.dataset.color;
            updateTheme();
            
            // Update active state
            colorOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });
    
    // Background selection
    bgOptions.forEach(option => {
        option.addEventListener('click', () => {
            const newBg = option.dataset.bg;
            
            // Remove all possible background classes
            const bgClasses = Array.from(bgOptions).map(opt => `bg-${opt.dataset.bg}`);
            terminalContainer.classList.remove(...bgClasses);
            
            // Add new background class
            terminalContainer.classList.add(`bg-${newBg}`);
            
            // Update active state
            bgOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Save to localStorage
            localStorage.setItem('terminalBg', newBg);
        });
    });
    
    // Font size selection
    fontSizeSelect.addEventListener('change', () => {
        const fontSize = fontSizeSelect.value;
        terminalOutput.classList.remove('text-sm', 'text-base', 'text-lg');
        terminalOutput.classList.add(`text-${fontSize}`);
        localStorage.setItem('terminalFontSize', fontSize);
    });
    
    // Initialize terminal
    initTerminal();
    
    // Export Filesystem
document.getElementById('export-fs').addEventListener('click', () => {
    const dataStr = JSON.stringify(virtualFS, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'virtualFS-backup.json';
    a.click();

    URL.revokeObjectURL(url);
});

// Import Filesystem
document.getElementById('import-fs').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (typeof imported === 'object' && imported !== null) {
                Object.assign(virtualFS, imported);
                saveFS();
                addOutput('Filesystem imported successfully.');
            } else {
                addOutput('Invalid file format.', true);
            }
        } catch (err) {
            addOutput('Error importing filesystem: ' + err.message, true);
        }
    };
    reader.readAsText(file);
});
});