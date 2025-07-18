document.addEventListener('DOMContentLoaded', function() {
    // Initialize the code library
    const codeLibrary = {
        topics: [],
        snippets: {},
        currentTopic: null,
        currentSnippet: null,

        // Load data from localStorage
        load: function() {
            const savedData = localStorage.getItem('pythonCodeLibrary');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.topics = data.topics || [];
                this.snippets = data.snippets || {};
            }
            this.renderTopics();
        },

        // Save data to localStorage
        save: function() {
            const data = {
                topics: this.topics,
                snippets: this.snippets
            };
            localStorage.setItem('pythonCodeLibrary', JSON.stringify(data));
        },

        // Add a new topic
        addTopic: function(topicName) {
            if (!topicName.trim()) return false;
            if (this.topics.includes(topicName)) return false;
            
            this.topics.push(topicName);
            this.snippets[topicName] = [];
            this.save();
            this.renderTopics();
            return true;
        },

        // Update a topic
        updateTopic: function(index, newTopicName) {
            newTopicName = newTopicName.trim();
            if (!newTopicName) return false;
            
            // Check if the new name already exists (excluding current index)
            const existingIndex = this.topics.findIndex((value, i) => 
                value === newTopicName && i !== index
            );
            
            if (existingIndex !== -1) {
                return false;
            }

            if (index >= 0 && index < this.topics.length) {
                const oldTopic = this.topics[index];
                
                // Update topics array
                this.topics[index] = newTopicName;
                
                // Update snippets reference
                this.snippets[newTopicName] = this.snippets[oldTopic];
                delete this.snippets[oldTopic];
                
                // Update current topic if it was the one being renamed
                if (this.currentTopic === oldTopic) {
                    this.currentTopic = newTopicName;
                }
                
                this.save();
                this.renderTopics();
                this.renderSnippets();
                return true;
            }
            return false;
        },

        // Delete a topic
        deleteTopic: function(topicName) {
            const index = this.topics.indexOf(topicName);
            if (index === -1) return false;

            this.topics.splice(index, 1);
            delete this.snippets[topicName];
            this.save();

            if (this.currentTopic === topicName) {
                this.currentTopic = null;
                this.currentSnippet = null;
                this.renderSnippets();
                this.renderCode();
            }

            this.renderTopics();
            return true;
        },

        // Add a new code snippet
        addSnippet: function(topicName, snippetName, snippetCode) {
            if (!topicName || !snippetName.trim() || !snippetCode.trim()) return false;

            const snippet = {
                name: snippetName,
                code: snippetCode
            };

            this.snippets[topicName].push(snippet);
            this.save();

            if (this.currentTopic === topicName) {
                this.renderSnippets();
            }

            return true;
        },

        // Update a code snippet
        updateSnippet: function(topicName, snippetIndex, newName, newCode) {
            if (!topicName || snippetIndex < 0 || !newName.trim() || !newCode.trim()) return false;

            this.snippets[topicName][snippetIndex].name = newName;
            this.snippets[topicName][snippetIndex].code = newCode;
            this.save();

            if (this.currentTopic === topicName) {
                this.renderSnippets();
                if (this.currentSnippet === snippetIndex) {
                    this.renderCode();
                }
            }

            return true;
        },

        // Delete a code snippet
        deleteSnippet: function(topicName, snippetIndex) {
            if (!topicName || snippetIndex < 0) return false;

            this.snippets[topicName].splice(snippetIndex, 1);
            this.save();

            if (this.currentTopic === topicName) {
                if (this.currentSnippet === snippetIndex) {
                    this.currentSnippet = null;
                    this.renderCode();
                }
                this.renderSnippets();
            }

            return true;
        },

        // Render topics list
        renderTopics: function() {
            const topicsList = document.getElementById('topicsList');
            topicsList.innerHTML = '';
            
            this.topics.forEach((topic, index) => {
                const li = document.createElement('li');
                li.textContent = topic;
                li.dataset.index = index;
                if (topic === this.currentTopic) {
                    li.classList.add('active');
                }

                li.addEventListener('click', () => {
                    this.currentTopic = topic;
                    this.currentSnippet = null;
                    this.renderTopics();
                    this.renderSnippets();
                    this.renderCode();
                });

                topicsList.appendChild(li);
            });
        },

        // Render snippets list
        renderSnippets: function() {
            const snippetsList = document.getElementById('snippetsList');
            const currentTopicTitle = document.getElementById('currentTopicTitle');

            snippetsList.innerHTML = '';

            if (this.currentTopic) {
                currentTopicTitle.textContent = this.currentTopic;

                const topicSnippets = this.snippets[this.currentTopic] || [];

                topicSnippets.forEach((snippet, index) => {
                    const li = document.createElement('li');
                    li.textContent = snippet.name;
                    if (index === this.currentSnippet) {
                        li.classList.add('active');
                    }

                    li.addEventListener('click', () => {
                        this.currentSnippet = index;
                        this.renderSnippets();
                        this.renderCode();
                    });

                    snippetsList.appendChild(li);
                });
            } else {
                currentTopicTitle.textContent = 'Select a Topic';
            }
        },

        // Render code display
        renderCode: function() {
            const snippetTitle = document.getElementById('snippetTitle');
            const codeDisplay = document.getElementById('codeDisplay');

            if (this.currentTopic !== null && this.currentSnippet !== null) {
                const snippet = this.snippets[this.currentTopic][this.currentSnippet];
                snippetTitle.textContent = snippet.name;
                codeDisplay.textContent = snippet.code;
                hljs.highlightElement(codeDisplay);
            } else {
                snippetTitle.textContent = 'No snippet selected';
                codeDisplay.textContent = 'Select a code snippet to view';
            }
        },

        // Export data as JSON file
        exportData: function() {
            const data = {
                topics: this.topics,
                snippets: this.snippets
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'python_code_library_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        // Import data from JSON file
        importData: function(jsonData, importOption) {
            try {
                const data = JSON.parse(jsonData);
                
                if (importOption === 'replace') {
                    this.topics = data.topics || [];
                    this.snippets = data.snippets || {};
                } else { // merge
                    // Merge topics
                    data.topics.forEach(topic => {
                        if (!this.topics.includes(topic)) {
                            this.topics.push(topic);
                        }
                    });
                    
                    // Merge snippets
                    for (const topic in data.snippets) {
                        if (this.snippets[topic]) {
                            // Merge snippets for existing topics
                            data.snippets[topic].forEach(newSnippet => {
                                const exists = this.snippets[topic].some(
                                    s => s.name === newSnippet.name && s.code === newSnippet.code
                                );
                                if (!exists) {
                                    this.snippets[topic].push(newSnippet);
                                }
                            });
                        } else {
                            // Add new topics with their snippets
                            this.snippets[topic] = data.snippets[topic];
                        }
                    }
                }
                
                this.save();
                this.renderTopics();
                this.renderSnippets();
                this.renderCode();
                return true;
            } catch (e) {
                console.error('Error importing JSON:', e);
                return false;
            }
        }
    };

    // Initialize the library
    codeLibrary.load();

    // Modal elements
    const topicModal = document.getElementById('topicModal');
    const updateTopicModal = document.getElementById('topicModal_update');
    const snippetModal = document.getElementById('snippetModal');
    const importModal = document.getElementById('importModal');
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.close');

    // New Topic button
    document.getElementById('newTopicBtn').addEventListener('click', () => {
        document.getElementById('newTopicName').value = '';
        topicModal.style.display = 'block';
    });

    // Save Topic button
    document.getElementById('saveTopicBtn').addEventListener('click', () => {
        const topicName = document.getElementById('newTopicName').value.trim();
        if (topicName) {
            if (codeLibrary.addTopic(topicName)) {
                topicModal.style.display = 'none';
            } else {
                alert('Topic already exists!');
            }
        }
    });

    // Update Topic functionality
document.getElementById('topicsList').addEventListener('dblclick', function(e) {
    if (e.target.tagName === 'LI') {
        const index = parseInt(e.target.dataset.index);
        const oldName = e.target.textContent;
        document.getElementById('UpdateTopicInput').value = oldName;
        document.getElementById('UpdateTopic').value = index;
        updateTopicModal.style.display = 'block';
    }
});

    // Save Updated Topic button
    document.getElementById('saveUpdatedTopicBtn').addEventListener('click', function() {
        const index = parseInt(document.getElementById('UpdateTopic').value);
        const newName = document.getElementById('UpdateTopicInput').value.trim();
        
        if (codeLibrary.updateTopic(index, newName)) {
            updateTopicModal.style.display = 'none';
        } else {
            alert('Topic name already exists or is invalid!');
        }
    });

    // New Snippet button
    document.getElementById('newSnippetBtn').addEventListener('click', () => {
        if (!codeLibrary.currentTopic) {
            alert('Please select a topic first!');
            return;
        }

        document.getElementById('snippetName').value = '';
        document.getElementById('snippetCode').value = '';
        document.getElementById('snippetModalTitle').textContent = 'New Code Snippet';
        snippetModal.style.display = 'block';
    });

    // Edit button
    document.getElementById('editBtn').addEventListener('click', () => {
        if (codeLibrary.currentTopic === null || codeLibrary.currentSnippet === null) {
            alert('Please select a snippet to edit!');
            return;
        }

        const snippet = codeLibrary.snippets[codeLibrary.currentTopic][codeLibrary.currentSnippet];
        document.getElementById('snippetName').value = snippet.name;
        document.getElementById('snippetCode').value = snippet.code;
        document.getElementById('snippetModalTitle').textContent = 'Edit Code Snippet';
        snippetModal.style.display = 'block';
    });

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', () => {
        if (codeLibrary.currentTopic === null || codeLibrary.currentSnippet === null) {
            alert('Please select a snippet to copy!');
            return;
        }

        const snippet = codeLibrary.snippets[codeLibrary.currentTopic][codeLibrary.currentSnippet];
        navigator.clipboard.writeText(snippet.code)
            .then(() => alert('Code copied to clipboard!'))
            .catch(err => alert('Failed to copy code: ' + err));
    });

    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', () => {
        if (codeLibrary.currentTopic === null || codeLibrary.currentSnippet === null) {
            alert('Please select a snippet to delete!');
            return;
        }

        if (confirm('Are you sure you want to delete this snippet?')) {
            codeLibrary.deleteSnippet(codeLibrary.currentTopic, codeLibrary.currentSnippet);
        }
    });

    // Save Snippet button (for both new and edit)
    document.getElementById('saveSnippetBtn').addEventListener('click', () => {
        const name = document.getElementById('snippetName').value.trim();
        const code = document.getElementById('snippetCode').value.trim();

        if (!name || !code) {
            alert('Please enter both a name and code for the snippet!');
            return;
        }

        const isEdit = document.getElementById('snippetModalTitle').textContent === 'Edit Code Snippet';

        if (isEdit) {
            codeLibrary.updateSnippet(
                codeLibrary.currentTopic,
                codeLibrary.currentSnippet,
                name,
                code
            );
        } else {
            codeLibrary.addSnippet(
                codeLibrary.currentTopic,
                name,
                code
            );
        }

        snippetModal.style.display = 'none';
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        codeLibrary.exportData();
    });

    // Import button
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('jsonFileInput').value = '';
        document.querySelector('input[name="importOption"][value="merge"]').checked = true;
        importModal.style.display = 'block';
    });

    // Confirm Import button
    document.getElementById('confirmImportBtn').addEventListener('click', () => {
        const fileInput = document.getElementById('jsonFileInput');
        const importOption = document.querySelector('input[name="importOption"]:checked').value;

        if (fileInput.files.length === 0) {
            alert('Please select a JSON file to import');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const success = codeLibrary.importData(e.target.result, importOption);
            if (success) {
                alert('Data imported successfully!');
                importModal.style.display = 'none';
            } else {
                alert('Failed to import data. Please check the file format.');
            }
        };

        reader.onerror = function() {
            alert('Error reading file');
        };

        reader.readAsText(file);
    });

    // Close modals when clicking the X button
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            topicModal.style.display = 'none';
            updateTopicModal.style.display = 'none';
            snippetModal.style.display = 'none';
            importModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === topicModal) topicModal.style.display = 'none';
        if (event.target === updateTopicModal) updateTopicModal.style.display = 'none';
        if (event.target === snippetModal) snippetModal.style.display = 'none';
        if (event.target === importModal) importModal.style.display = 'none';
    });
});