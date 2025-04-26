document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api/v1/music'; // Base for regular API calls
    const STREAM_API_BASE_URL = '/api/v1/music/stream/'; // Base for streaming endpoint
    const AUDIO_MIME_CODEC = 'audio/mpeg'; // Assuming MP3 streaming

    const tabs = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const updateForm = document.getElementById('updateForm');
    const fetchUpdateStatusEl = document.getElementById('fetchUpdateStatus');

    // --- Streamer State Variables ---
    let mediaSource = null;
    let sourceBuffer = null;
    let currentObjectUrl = null;
    let isFetchingStream = false;

    // --- Tab Handling ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPaneId = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(targetPaneId).classList.add('active');
            // Reset stream state if navigating away from stream tab
            if (targetPaneId !== 'streamTab' && isFetchingStream) {
                console.log("Navigating away from stream tab, resetting stream state.");
                resetStreamPlayerAndState();
            }
        });
    });

    // --- API Helper (Standard) ---
    async function fetchApi(endpoint, method = 'GET', body = null, isFormData = false, requireAuth = true) {
        const token = document.getElementById('authToken').value;
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method: method,
            headers: {},
        };

        if (requireAuth) {
            if (!token) {
                throw new Error('Authentication token is missing.');
            }
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            if (isFormData) {
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        const response = await fetch(url, options);
        let responseData;
        const contentType = response.headers.get('content-type');

        if (response.status === 204) {
             responseData = { message: 'Operation successful (No Content)' };
        } else if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = { error: await response.text() };
        }

        if (!response.ok) {
            const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }
        return responseData;
    }

    // --- UI Feedback Helpers ---
    function setStatus(elementId, type, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.className = `status ${type}`;
        el.textContent = message;
        el.style.display = message ? 'block' : 'none';
    }

    function displayResult(resultElId, data) {
         const resultEl = document.getElementById(resultElId);
         if (resultEl) {
            resultEl.textContent = JSON.stringify(data, null, 2);
         }
    }

    function handleApiCall(button, statusElId, resultElId, apiPromise) {
         const resultEl = document.getElementById(resultElId);
         if (button) button.disabled = true;
         setStatus(statusElId, 'loading', 'Processing...');
         if(resultEl) resultEl.textContent = '';

        return apiPromise
            .then(data => {
                setStatus(statusElId, 'success', data?.message || 'Success!');
                if(resultEl) displayResult(resultElId, data);
                return data;
            })
            .catch(error => {
                setStatus(statusElId, 'error', `Error: ${error.message}`);
                 console.error("API Call Failed:", error);
                 throw error;
            })
            .finally(() => {
                if (button) button.disabled = false;
            });
    }

    // --- Date Formatting Helper ---
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return '';
        }
    }

    // --- Streaming Logic (Adapted from Standalone Example) ---

    function waitForBufferReady(buffer) {
        return new Promise((resolve, reject) => {
            let errorListener, updateListener;
            const cleanup = () => {
                if (buffer && errorListener) buffer.removeEventListener('error', errorListener);
                if (buffer && updateListener) buffer.removeEventListener('updateend', updateListener);
            };
            const checkAndUpdate = () => {
                if (!buffer.updating) {
                    cleanup();
                    resolve();
                }
            };
            errorListener = (e) => {
                cleanup();
                console.error("SourceBuffer error event while waiting:", e);
                reject(new Error("SourceBuffer error while waiting"));
            };
            updateListener = checkAndUpdate;

            buffer.addEventListener('updateend', updateListener);
            buffer.addEventListener('error', errorListener);
            checkAndUpdate(); // Initial check
        });
    }

    async function handleSourceOpen() {
        console.log('MediaSource opened.');
        setStatus('streamStatus', 'loading', 'Media source ready. Fetching audio data...');
        const audioPlayer = document.getElementById('audioPlayer');
        const musicId = document.getElementById('streamMusicId').value.trim();
        const authToken = document.getElementById('authToken').value.trim(); // Get token from main input

        if (!MediaSource.isTypeSupported(AUDIO_MIME_CODEC)) {
            setStatus('streamStatus', 'error', `Error: MIME type "${AUDIO_MIME_CODEC}" is not supported.`);
            cleanupStreamOnError();
            return;
        }

        try {
            sourceBuffer = mediaSource.addSourceBuffer(AUDIO_MIME_CODEC);
            console.log('SourceBuffer created for', AUDIO_MIME_CODEC);
            setupSourceBufferListeners(sourceBuffer);

            const streamUrl = `${STREAM_API_BASE_URL}${musicId}`;
            const response = await fetch(streamUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                let errorDetail = `HTTP status ${response.status}`;
                try {
                    const errorText = await response.text(); // Try reading error text
                    errorDetail = `${response.status} - ${errorText || 'Unknown server error'}`;
                } catch (e) { /* Ignore if reading text fails */ }
                throw new Error(`Failed to fetch audio stream: ${errorDetail}`);
            }
            if (!response.body) throw new Error('Response body is null, cannot read stream.');

            setStatus('streamStatus', 'loading', 'Streaming audio data...');
            await pumpStreamToBuffer(response.body.getReader(), sourceBuffer);

        } catch (error) {
            console.error('Error during streaming setup or fetch:', error);
            setStatus('streamStatus', 'error', `Stream Setup Error: ${error.message}`);
            cleanupStreamOnError();
        }
    }

    async function pumpStreamToBuffer(reader, buffer) {
        try {
            while (true) {
                if (!isFetchingStream) { // Check if fetch was cancelled
                     console.log("Stream fetch cancelled during pumping.");
                     break;
                }
                const { done, value } = await reader.read();

                if (done) {
                    console.log('Stream finished.');
                    await waitForBufferReady(buffer);
                    setStatus('streamStatus', 'success', 'Stream finished. Ready to play entire track.');
                    endMediaStream();
                    break;
                }

                await waitForBufferReady(buffer);

                try {
                     // console.log(`Appending chunk of size ${value.byteLength}`); // Can be noisy
                     buffer.appendBuffer(value);
                } catch (appendError) {
                     console.error('Error directly during appendBuffer:', appendError);
                     // Handle specific QuotaExceededError if needed
                     if (appendError.name === 'QuotaExceededError') {
                         setStatus('streamStatus', 'error', `Buffering error: Quota exceeded. Try reloading.`);
                     } else {
                        setStatus('streamStatus', 'error', `Streaming error during buffer append: ${appendError.message}`);
                     }
                     await reader.cancel("Buffer append error"); // Cancel the stream reader
                     cleanupStreamOnError(); // Cleanup on append error
                     break; // Exit loop on append error
                }
            }
        } catch (error) {
             console.error('Error during stream pumping loop:', error);
             // Check if the error is due to cancellation
             if (error.message !== 'Buffer append error') {
                 setStatus('streamStatus', 'error', `Streaming error: ${error.message}`);
                 cleanupStreamOnError(); // Cleanup if not already handled
             }
        } finally {
             // Don't reset isFetchingStream here, let resetStreamPlayerAndState handle it
             console.log("Pump loop finished or exited.");
             // Reset button state if loop finishes naturally or via cancellation handled elsewhere
             const loadButton = document.getElementById('streamMusicBtn');
             if(loadButton) {
                loadButton.disabled = false;
                loadButton.textContent = 'Load Stream';
             }
        }
    }


    function endMediaStream() {
        if (mediaSource && mediaSource.readyState === 'open') {
            try {
                if (!sourceBuffer || !sourceBuffer.updating) {
                     mediaSource.endOfStream();
                     console.log('Called endOfStream()');
                } else {
                    console.warn("Buffer still updating, delaying endOfStream call");
                     sourceBuffer.addEventListener('updateend', () => {
                         if (mediaSource && mediaSource.readyState === 'open') {
                             mediaSource.endOfStream();
                             console.log('Called endOfStream() after buffer update');
                         }
                     }, { once: true });
                }
            } catch (e) {
                console.error("Error calling endOfStream:", e);
                // Consider resetting state even if endOfStream fails
                // resetStreamPlayerAndState();
            }
        } else {
            console.log("Cannot call endOfStream: MediaSource not open. State:", mediaSource?.readyState);
        }
    }

    function handleLoadStreamClick() {
        const loadButton = document.getElementById('streamMusicBtn');
        if (isFetchingStream) {
            console.warn("Fetch already in progress.");
            return;
        }

        const musicId = document.getElementById('streamMusicId').value.trim();
        const authToken = document.getElementById('authToken').value.trim();
        const audioPlayer = document.getElementById('audioPlayer');

        resetStreamPlayerAndState(); // Clean up previous state before starting new

        if (!musicId) { setStatus('streamStatus', 'error', 'Please enter a Music ID.'); return; }
        if (!authToken) { setStatus('streamStatus', 'error', 'Please enter the Authorization token value.'); return; }
        if (!window.MediaSource) { setStatus('streamStatus', 'error', 'Browser lacks Media Source Extensions support.'); return; }

        isFetchingStream = true;
        loadButton.disabled = true;
        loadButton.textContent = 'Loading...';
        setStatus('streamStatus', 'loading', 'Initializing stream...');

        try {
            mediaSource = new MediaSource();
            currentObjectUrl = URL.createObjectURL(mediaSource);
            audioPlayer.src = currentObjectUrl;

            // Use arrow function to preserve 'this' if needed, or bind
            mediaSource.addEventListener('sourceopen', handleSourceOpen);
            mediaSource.addEventListener('sourceended', () => console.log('MediaSource ended.'));
            mediaSource.addEventListener('sourceclose', () => {
                console.log('MediaSource closed.');
                // We might want to reset state fully when source closes unexpectedly
                // resetStreamPlayerAndState(); // Consider implications
            });
             mediaSource.addEventListener('error', (e) => {
                 console.error('MediaSource error event:', e);
                 setStatus('streamStatus', 'error', 'A MediaSource error occurred.');
                 cleanupStreamOnError();
             });
        } catch(e) {
            console.error("Error creating MediaSource or Object URL:", e);
            setStatus('streamStatus', 'error', `Initialization Error: ${e.message}`);
            isFetchingStream = false; // Ensure flag is reset
            loadButton.disabled = false;
            loadButton.textContent = 'Load Stream';
        }
    }


    function setupSourceBufferListeners(buffer) {
        buffer.addEventListener('error', (e) => {
            console.error("SourceBuffer 'error' event:", e);
            // Potentially trigger cleanup, but pumpStreamToBuffer might handle it
             setStatus('streamStatus', 'error', 'A SourceBuffer error occurred during operation.');
             // cleanupStreamOnError(); // Avoid duplicate cleanup if pump loop handles it
        });
        buffer.addEventListener('abort', () => {
             console.warn('SourceBuffer aborted.');
             // May need cleanup depending on why it aborted
             setStatus('streamStatus', 'loading', 'Buffer operation aborted.');
             // cleanupStreamOnError(); // Or handle based on context
        });
         // 'updateend' is handled by waitForBufferReady
    }

    function setupAudioPlayerListeners() {
         const audioPlayer = document.getElementById('audioPlayer');
         if (!audioPlayer) return; // Guard against missing element

        audioPlayer.addEventListener('error', (e) => {
            console.error('Audio Player Error Event:', e, e.target.error);
            // Avoid overwriting more specific stream errors
            if (!document.getElementById('streamStatus').classList.contains('error') && e.target.error) {
                setStatus('streamStatus', 'error', `Audio player error: ${e.target.error?.message || 'Unknown player error'} (Code: ${e.target.error?.code})`);
            } else if (!document.getElementById('streamStatus').classList.contains('error')) {
                 setStatus('streamStatus', 'error', 'An unknown audio player error occurred.');
            }
             // Error might warrant resetting stream state
             // cleanupStreamOnError();
        });
        // Optional: Add listeners for more detailed feedback
        // audioPlayer.addEventListener('loadedmetadata', () => setStatus('streamStatus', 'loading', 'Audio metadata loaded.'));
        // audioPlayer.addEventListener('canplay', () => setStatus('streamStatus', 'success', 'Audio ready to play.'));
        // audioPlayer.addEventListener('waiting', () => setStatus('streamStatus', 'loading', 'Buffering...'));
        // audioPlayer.addEventListener('playing', () => setStatus('streamStatus', 'success', 'Playing...'));
        // audioPlayer.addEventListener('ended', () => setStatus('streamStatus', 'success', 'Playback finished.'));
        // audioPlayer.addEventListener('emptied', () => console.log('Audio player emptied.'));
    }

    function resetStreamPlayerAndState() {
        console.log('Resetting stream player and state.');
        const audioPlayer = document.getElementById('audioPlayer');
        const loadButton = document.getElementById('streamMusicBtn');

        isFetchingStream = false; // Crucial: Signal any ongoing fetch to stop

        if (audioPlayer) {
            if (audioPlayer.src && currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
                console.log('Revoked previous Object URL.');
            }
             if (!audioPlayer.paused) {
                try { audioPlayer.pause(); } catch(e) {/*ignore*/}
             }
            audioPlayer.removeAttribute('src');
            try { audioPlayer.load(); } catch(e) {/*ignore*/} // Reset internal state
        }

        // Clean up MediaSource and SourceBuffer if they exist
        if (mediaSource) {
            // Remove listeners manually before nulling out, difficult without references
            // Relying on GC primarily after removing references
             if (mediaSource.readyState === 'open' && sourceBuffer && mediaSource.sourceBuffers.length > 0) {
                try {
                    // Avoid removing buffer if media source is already closed
                    if (!sourceBuffer.updating) {
                        mediaSource.removeSourceBuffer(sourceBuffer);
                        console.log('Removed existing SourceBuffer.');
                    } else {
                        console.warn("Cannot remove SourceBuffer while it's updating during reset.");
                        // Potentially add listeners to remove after update, but complex
                    }
                } catch (e) {
                    console.warn("Error removing SourceBuffer during reset:", e);
                }
            }
             // No reliable way to remove anon listeners; set to null for GC
        }


        mediaSource = null;
        sourceBuffer = null;
        currentObjectUrl = null;


        if (loadButton) {
            loadButton.disabled = false;
            loadButton.textContent = 'Load Stream';
        }
        // Clear status *unless* it's showing a persistent error from cleanup
         const statusEl = document.getElementById('streamStatus');
         if (statusEl && !statusEl.classList.contains('error')) {
            setStatus('streamStatus', '', ''); // Clear non-error status
         }
        console.log('Player and state reset complete.');
    }


    function cleanupStreamOnError() {
         console.warn("Attempting stream cleanup due to error...");
         const loadButton = document.getElementById('streamMusicBtn');

         isFetchingStream = false; // Stop any fetching

         if (mediaSource && mediaSource.readyState === 'open') {
             try {
                // Similar logic as reset, but might try endOfStream('network')
                const cleanupAction = () => {
                     try {
                         if (sourceBuffer && mediaSource.sourceBuffers.length > 0) {
                             console.log("Removing source buffer during error cleanup...");
                             mediaSource.removeSourceBuffer(sourceBuffer);
                         }
                         if (mediaSource.readyState === 'open') {
                             console.log("Calling endOfStream('network') due to error...");
                            mediaSource.endOfStream('network'); // Signal network error
                         }
                     } catch (innerError) {
                        console.warn("Inner error during MSE error cleanup:", innerError);
                     } finally {
                        resetStreamPlayerAndState(); // Ensure state is fully reset after attempt
                     }
                };

                if (sourceBuffer && sourceBuffer.updating) {
                     console.warn("Buffer updating during error cleanup, delaying action...");
                     const tempOnError = () => cleanupAction(); // Use same action on error/update
                     sourceBuffer.addEventListener('updateend', cleanupAction, { once: true });
                     sourceBuffer.addEventListener('error', tempOnError, { once: true });
                } else {
                     cleanupAction();
                }

             } catch (e) {
                 console.warn("Outer error during MediaSource error cleanup initiation:", e);
                 resetStreamPlayerAndState(); // Fallback reset
             }
         } else {
              if (mediaSource) console.log("MediaSource not 'open' during error cleanup, state:", mediaSource.readyState);
              resetStreamPlayerAndState(); // Reset state if MS not open/exists
         }
         // Ensure button is re-enabled even if cleanup has issues
         if (loadButton) {
            loadButton.disabled = false;
            loadButton.textContent = 'Load Stream';
         }
    }


    // --- Event Listeners (Existing + Stream Logic) ---

    // 1. Upload Music
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const button = form.querySelector('button');

        const collaboratorsInput = form.elements['collaborators'].value.trim();
        const creditsInput = form.elements['credits'].value.trim();
        const genreInput = form.elements['genre_id_input'].value.trim();

        formData.delete('genre_id_input');
        if (!formData.get('album_id')) formData.delete('album_id');
        if (!formData.get('release_date')) formData.delete('release_date');

        try {
            if (collaboratorsInput) formData.set('collaborators', JSON.parse(collaboratorsInput)); else formData.delete('collaborators');
            if (creditsInput) formData.set('credits', JSON.parse(creditsInput)); else formData.delete('credits');
        } catch (jsonError) {
            setStatus('uploadStatus', 'error', `Invalid JSON: ${jsonError.message}`); return;
        }

        if (genreInput) {
            const genreIds = genreInput.split(',').map(id => id.trim()).filter(id => id);
            genreIds.forEach(id => formData.append('genre_id', id));
        }

        handleApiCall(button, 'uploadStatus', 'uploadResult', fetchApi('/upload', 'POST', formData, true, true))
            .then(() => form.reset())
            .catch(() => {});
    });

    // 2. Get Music Details
    document.getElementById('getMusicBtn').addEventListener('click', (e) => {
        const musicId = document.getElementById('getMusicId').value;
        if (!musicId) { setStatus('getStatus', 'error', 'Music ID is required.'); return; }
        handleApiCall(e.target, 'getStatus', 'getResult', fetchApi(`/${musicId}`, 'GET', null, false, false));
    });

    // 3. Stream Music (Now uses MSE)
    document.getElementById('streamMusicBtn').addEventListener('click', handleLoadStreamClick); // Changed handler
    setupAudioPlayerListeners(); // Setup player listeners once on load


    // 4. Update Music - Step 1: Fetch Data
    document.getElementById('fetchMusicDataBtn').addEventListener('click', (e) => {
        const musicId = document.getElementById('fetchUpdateMusicId').value;
        if (!musicId) { setStatus('fetchUpdateStatus', 'error', 'Music ID to fetch is required.'); return; }

        const fetchPromise = fetchApi(`/${musicId}`, 'GET', null, false, false);

        handleApiCall(e.target, 'fetchUpdateStatus', null, fetchPromise)
            .then(response => {
                const musicData = response.data;
                 if (!musicData) throw new Error("Music data not found in response.");

                document.getElementById('updateMusicIdActual').value = musicData._id;
                document.getElementById('updateTitle').value = musicData.title || '';
                document.getElementById('updateCollaborators').value = JSON.stringify(musicData.collaborators || [], null, 2);
                document.getElementById('updateAlbumId').value = musicData.album_id || '';
                document.getElementById('updateGenreId').value = (musicData.genre_id || []).join(',');
                document.getElementById('updateReleaseDate').value = formatDateForInput(musicData.release_date);
                document.getElementById('updateCredits').value = JSON.stringify(musicData.credits || {}, null, 2);

                updateForm.style.display = 'block';
                setStatus('fetchUpdateStatus', 'success', 'Data loaded. You can now edit and save.');
            })
            .catch(error => {
                 setStatus('fetchUpdateStatus', 'error', `Failed to fetch data: ${error.message}`);
                 updateForm.style.display = 'none';
            });
    });

    // 4. Update Music - Step 2: Submit Changes
    updateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const musicId = form.elements['updateMusicIdActual'].value;
        const button = form.querySelector('button');
        if (!musicId) { setStatus('updateStatus', 'error', 'Cannot update without a Music ID.'); return; }

        const updateData = {};
        const title = form.elements['title'].value.trim();
        const albumId = form.elements['album_id'].value.trim();
        const releaseDate = form.elements['release_date'].value;
        const collaboratorsInput = form.elements['collaborators'].value.trim();
        const creditsInput = form.elements['credits'].value.trim();
        const genreInput = form.elements['genre_id_input'].value.trim();

        if (title) updateData.title = title;
        updateData.album_id = albumId || null;
        if (releaseDate) updateData.release_date = releaseDate;

        try {
            if (collaboratorsInput) updateData.collaborators = JSON.parse(collaboratorsInput);
            if (creditsInput) updateData.credits = JSON.parse(creditsInput);
            updateData.genre_id = genreInput ? genreInput.split(',').map(id => id.trim()).filter(id => id) : [];

        } catch (jsonError) {
             setStatus('updateStatus', 'error', `Invalid JSON: ${jsonError.message}`); return;
        }

        if (Object.keys(updateData).filter(k => k !== 'album_id' && k !== 'genre_id').length === 0 && albumId === (document.getElementById('updateAlbumId').defaultValue || '') && genreInput === (document.getElementById('updateGenreId').defaultValue || '')) {
             setStatus('updateStatus', 'loading', 'No changes detected.'); return; // Use loading class for neutral msg
         }

        handleApiCall(button, 'updateStatus', 'updateResult', fetchApi(`/update/${musicId}`, 'PUT', updateData, false, true));
    });


    // 5. Delete Music
    document.getElementById('deleteMusicBtn').addEventListener('click', (e) => {
        const musicId = document.getElementById('deleteMusicId').value;
        if (!musicId) { setStatus('deleteStatus', 'error', 'Music ID is required.'); return; }
        if (!confirm(`Are you sure you want to soft-delete music track ${musicId}?`)) return;
        handleApiCall(e.target, 'deleteStatus', 'deleteResult', fetchApi(`/delete/${musicId}`, 'DELETE', null, false, true));
    });

     // 6. List New Music
    document.getElementById('listNewBtn').addEventListener('click', (e) => {
        const limit = document.getElementById('listNewLimit').value || 12;
        const endpoint = `/list?limit=${limit}`;
        handleApiCall(e.target, 'listNewStatus', 'listNewResult', fetchApi(endpoint, 'GET', null, false, false));
    });

    // 7. Search Music
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const params = new URLSearchParams();
        const button = form.querySelector('button');

        for (const [key, value] of formData.entries()) {
            if (value) params.set(key, value);
        }
        const endpoint = `/search?${params.toString()}`;
        handleApiCall(button, 'searchStatus', 'searchResult', fetchApi(endpoint, 'GET', null, false, false));
    });
});