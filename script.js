document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('counter-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1920;
    canvas.height = 1080;

    const sequenceInput = document.getElementById('sequence');
    const sequenceHint = document.getElementById('sequence-hint');
    const dataTypeSelect = document.getElementById('data-type');
    const formatGroup = document.getElementById('format-group');
    const dateFormatSelect = document.getElementById('date-format');
    const secondsGroup = document.getElementById('seconds-group');
    const showSecondsCheckbox = document.getElementById('show-seconds');
    const easingTypeSelect = document.getElementById('easing-type');
    const durationInput = document.getElementById('duration');
    const durationLabel = document.getElementById('duration-label');
    const bgColorSelect = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const visualEffectSelect = document.getElementById('visual-effect');
    const exportFormatSelect = document.getElementById('export-format');
    const filenameInput = document.getElementById('filename');
    const startBtn = document.getElementById('start-btn');
    const recordBtn = document.getElementById('record-btn');
    const progressText = document.getElementById('progress-text');

    const numberFormatter = new Intl.NumberFormat('fr-FR');
    let isProcessing = false;

    textColorInput.addEventListener('input', initCanvas);
    visualEffectSelect.addEventListener('change', initCanvas);
    bgColorSelect.addEventListener('change', (e) => {
        document.body.style.backgroundColor = e.target.value;
        initCanvas();
    });

    dataTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'dates') {
            sequenceInput.value = "2024-01-01 08:00, 2024-12-31 23:59";
            sequenceHint.innerText = "Format attendu : AAAA-MM-JJ HH:MM";
            formatGroup.style.display = 'flex';
            durationLabel.innerText = "Durée du défilement (en secondes)";
        } else {
            sequenceInput.value = "0, 200000";
            sequenceHint.innerText = "Ex: 0, 150, 300";
            formatGroup.style.display = 'none';
            durationLabel.innerText = "Durée entre chaque étape (en secondes)";
        }
        toggleSecondsVisibility();
        initCanvas();
    });

    dateFormatSelect.addEventListener('change', toggleSecondsVisibility);
    showSecondsCheckbox.addEventListener('change', initCanvas);

    function toggleSecondsVisibility() {
        if (dataTypeSelect.value === 'dates' && (dateFormatSelect.value === 'fr-time-below' || dateFormatSelect.value === 'fr-inline')) {
            secondsGroup.style.display = 'flex';
        } else {
            secondsGroup.style.display = 'none';
        }
        initCanvas();
    }

    function drawArchedText(ctx, text, yOffset, radius, inverted = false) {
        ctx.save();
        const totalWidth = ctx.measureText(text).width;
        const totalAngle = totalWidth / radius;

        if (!inverted) {
            ctx.translate(0, radius + yOffset);
            ctx.rotate(-totalAngle / 2);
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charAngle = ctx.measureText(char).width / radius;
                ctx.rotate(charAngle / 2);
                ctx.fillText(char, 0, -radius);
                ctx.rotate(charAngle / 2);
            }
        } else {
            ctx.translate(0, -radius + yOffset);
            ctx.rotate(totalAngle / 2); 
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const charAngle = ctx.measureText(char).width / radius;
                ctx.rotate(-charAngle / 2);
                ctx.fillText(char, 0, radius); 
                ctx.rotate(-charAngle / 2);
            }
        }
        ctx.restore();
    }

    function drawOnCanvas(text1, text2 = null, forceGreenScreen = false) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (forceGreenScreen) {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bgColorSelect.value !== 'transparent') {
            ctx.fillStyle = bgColorSelect.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const effect = visualEffectSelect.value;
        const color = textColorInput.value;

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (effect === 'shadow' || effect.includes('arch')) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;
        } else if (effect === 'neon') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 40;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowColor = 'transparent';
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);

        if (effect === 'skew') {
            ctx.transform(1, 0, -0.25, 1, 0, 0); 
        }

        const archRadius = 800;

        if (text2) {
            ctx.font = '700 100px "Roboto Mono", monospace';
            
            if (effect === 'arch') drawArchedText(ctx, text1, -70, archRadius, false);
            else if (effect === 'arch-inv') drawArchedText(ctx, text1, -70, archRadius, true);
            else ctx.fillText(text1, 0, -70);
            
            ctx.font = '700 70px "Roboto Mono", monospace';
            if (effect !== 'neon') ctx.globalAlpha = 0.85; 
            
            if (effect === 'arch') drawArchedText(ctx, text2, 70, archRadius - 140, false);
            else if (effect === 'arch-inv') drawArchedText(ctx, text2, 70, archRadius + 140, true);
            else ctx.fillText(text2, 0, 70);
            
            ctx.globalAlpha = 1.0;
        } else {
            ctx.font = '700 140px "Roboto Mono", monospace';
            
            if (effect === 'arch') drawArchedText(ctx, text1, 0, archRadius, false);
            else if (effect === 'arch-inv') drawArchedText(ctx, text1, 0, archRadius, true);
            else ctx.fillText(text1, 0, 0);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function formatAndDraw(val, mode, forceGreenScreen = false) {
        if (mode === 'dates') {
            const currentDate = new Date(val);
            const selectedFormat = dateFormatSelect.value;
            const hasSeconds = showSecondsCheckbox.checked;
            
            const timeOpts = hasSeconds ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : { hour: '2-digit', minute: '2-digit' };
            const dateOpts = { day: '2-digit', month: '2-digit', year: 'numeric' };

            if (selectedFormat === 'fr-time-below') {
                const dateStr = currentDate.toLocaleDateString('fr-FR', dateOpts);
                const timeStr = currentDate.toLocaleTimeString('fr-FR', timeOpts);
                drawOnCanvas(dateStr, timeStr, forceGreenScreen);
            } 
            else if (selectedFormat === 'fr-inline') {
                const dateStr = currentDate.toLocaleDateString('fr-FR', dateOpts);
                const timeStr = currentDate.toLocaleTimeString('fr-FR', timeOpts);
                drawOnCanvas(dateStr + " à " + timeStr, null, forceGreenScreen);
            }
            else if (selectedFormat === 'fr-only') {
                drawOnCanvas(currentDate.toLocaleDateString('fr-FR', dateOpts), null, forceGreenScreen);
            } 
            else if (selectedFormat === 'en-long') {
                drawOnCanvas(currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), null, forceGreenScreen);
            }
        } else {
            drawOnCanvas(numberFormatter.format(val), null, forceGreenScreen);
        }
    }

    function initCanvas() { 
        if (dataTypeSelect.value === 'dates') {
            const raw = sequenceInput.value.split(',')[0];
            const time = new Date(raw ? raw.trim().replace(' ', 'T') : Date.now()).getTime();
            formatAndDraw(isNaN(time) ? Date.now() : time, 'dates');
        } else {
            const raw = sequenceInput.value.split(',')[0];
            const num = parseFloat(raw);
            formatAndDraw(isNaN(num) ? 0 : num, 'numbers');
        }
    }
    
    document.fonts.ready.then(initCanvas);
    sequenceInput.addEventListener('input', initCanvas);

    function parseSequence() {
        const rawItems = sequenceInput.value.split(',');
        if (dataTypeSelect.value === 'dates') {
            return rawItems.map(s => new Date(s.trim().replace(' ', 'T')).getTime()).filter(t => !isNaN(t));
        } else {
            return rawItems.map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
        }
    }

    startBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        
        try {
            const sequence = parseSequence();
            const durationMs = parseFloat(durationInput.value) * 1000; 
            const mode = dataTypeSelect.value;
            const easing = easingTypeSelect.value;

            if (sequence.length < 2) {
                alert("⚠️ Veuillez entrer un départ et une arrivée valides.");
                return;
            }

            for (let i = 0; i < sequence.length - 1; i++) {
                await new Promise(resolve => {
                    let startTimestamp = null;
                    const step = (timestamp) => {
                        if (!startTimestamp) startTimestamp = timestamp;
                        const progress = Math.min((timestamp - startTimestamp) / durationMs, 1); 
                        let curve = easing === 'linear' ? progress : (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress));
                        formatAndDraw(Math.floor(curve * (sequence[i+1] - sequence[i]) + sequence[i]), mode);
                        
                        if (progress < 1) window.requestAnimationFrame(step);
                        else resolve();
                    };
                    window.requestAnimationFrame(step);
                });
            }
        } finally {
            isProcessing = false;
        }
    });

    recordBtn.addEventListener('click', async () => {
        if (isProcessing) return;

        let customName = filenameInput.value.trim();
        if (customName === "") customName = `compteur_HD_${Date.now()}`;
        if (customName.toLowerCase().endsWith('.webm')) customName = customName.slice(0, -5);
        const finalFilename = `${customName}.webm`;

        let fileStream = null;
        let useDirectToDisk = false;

        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: finalFilename,
                    types: [{ description: 'Fichier Vidéo WebM', accept: { 'video/webm': ['.webm'] } }]
                });
                fileStream = await fileHandle.createWritable();
                useDirectToDisk = true;
            } catch (e) { 
                if (e.name === 'AbortError') return; 
            }
        }

        isProcessing = true;
        startBtn.disabled = true;
        recordBtn.disabled = true;
        progressText.style.display = 'block';
        progressText.style.color = "#10b981"; 

        try {
            if (!window.VideoEncoder || !window.WebMMuxer) {
                throw new Error("Les outils vidéo ne sont pas chargés.");
            }

            const sequence = parseSequence();
            if (sequence.length < 2) throw new Error("Séquence invalide. Il faut au moins 2 valeurs.");

            const formatChoice = exportFormatSelect.value;

            const forceGreen = (formatChoice === 'green');
            const useAlpha = (formatChoice === 'vp9-alpha' || formatChoice === 'vp8-alpha');
            const isVP9 = (formatChoice === 'vp9-alpha');

            progressText.innerText = forceGreen 
                ? "⏳ Initialisation export Fond Vert..." 
                : `⏳ Initialisation export ${isVP9 ? 'VP9' : 'VP8'} Transparent...`;

            let codecConfig = {
                codec: isVP9 ? 'vp09.00.41.08' : 'vp8',
                width: 1920,
                height: 1080,
                framerate: 30,
                bitrate: 30_000_000
            };

            if (useAlpha) {
                codecConfig.alpha = 'keep';
                codecConfig.hardwareAcceleration = 'prefer-software';
            }

            let muxerTarget = useDirectToDisk 
                ? new WebMMuxer.FileSystemWritableFileStreamTarget(fileStream) 
                : new WebMMuxer.ArrayBufferTarget();

            const muxer = new WebMMuxer.Muxer({
                target: muxerTarget,
                video: { 
                    codec: isVP9 ? 'V_VP9' : 'V_VP8', 
                    width: 1920, 
                    height: 1080, 
                    frameRate: 30, 
                    alpha: useAlpha 
                }
            });

            let encoderError = null;
            const videoEncoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: e => {
                    console.error("Crash Encodeur:", e);
                    encoderError = e;
                }
            });

            videoEncoder.configure(codecConfig);

            const fps = 30;
            const durationPerStepInSeconds = parseFloat(durationInput.value);
            const framesPerStep = Math.floor(durationPerStepInSeconds * fps);
            const totalFrames = framesPerStep * (sequence.length - 1);
            let currentGlobalFrame = 0;
            const mode = dataTypeSelect.value;
            const easing = easingTypeSelect.value;

            for (let s = 0; s < sequence.length - 1; s++) {
                const startVal = sequence[s];
                const endVal = sequence[s+1];

                for (let i = 0; i <= framesPerStep; i++) {
                    if (encoderError) throw new Error("L'encodeur vidéo a crashé : " + encoderError.message);
                    if (i === framesPerStep && s < sequence.length - 2) continue;

                    const progress = framesPerStep === 0 ? 1 : i / framesPerStep;
                    let curveProgress = easing === 'linear' ? progress : (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress));
                    const currentVal = Math.floor(curveProgress * (endVal - startVal) + startVal);

                    formatAndDraw(currentVal, mode, forceGreen);

                    const timestampMicro = Math.round((currentGlobalFrame * 1000000) / fps);
                    
                    const frame = new VideoFrame(canvas, { 
                        timestamp: timestampMicro, 
                        alpha: useAlpha ? 'keep' : 'discard' 
                    });
                    
                    videoEncoder.encode(frame, { keyFrame: currentGlobalFrame % 150 === 0 });
                    frame.close();

                    currentGlobalFrame++;

                    if (currentGlobalFrame % 30 === 0) {
                        const percent = Math.round((currentGlobalFrame / totalFrames) * 100);
                        progressText.innerText = `⏳ Rendu HD en cours : ${percent}% ...`;
                        
                        while (videoEncoder.encodeQueueSize > 50) {
                            await new Promise(r => setTimeout(r, 10));
                        }
                        await new Promise(r => setTimeout(r, 0));
                    }
                }
            }

            progressText.innerText = `📦 Finalisation du fichier vidéo HD...`;
            await videoEncoder.flush();
            muxer.finalize();

            if (useDirectToDisk) {
                await fileStream.close();
            } else {
                const buffer = muxer.target.buffer;
                const blob = new Blob([buffer], { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = finalFilename; 
                a.click();
                URL.revokeObjectURL(url);
            }

            progressText.innerText = forceGreen 
                ? `✅ Export réussi (Fond Vert Intentionnel) !` 
                : `✅ Vidéo ${isVP9 ? 'VP9' : 'VP8'} transparente exportée avec succès !`;

        } catch (err) {
            console.error(err);
            progressText.innerText = `❌ Erreur : ${err.message}`;
            progressText.style.color = "red";
        } finally {
            startBtn.disabled = false;
            recordBtn.disabled = false;
            isProcessing = false;
            initCanvas();
        }
    });
});
