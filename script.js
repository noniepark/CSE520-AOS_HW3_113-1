let participants = [];
let colors = [];
let wheelSegments = [];

function generateInputs() {
    const numParticipants = document.getElementById('numParticipants').value;
    const participantsInputs = document.getElementById('participantsInputs');
    participantsInputs.innerHTML = '';
    participants = [];
    colors = [];
    wheelSegments = [];

    for (let i = 0; i < numParticipants; i++) {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = `Name ${i + 1}`;
        nameInput.required = true;
        participantsInputs.appendChild(nameInput);

        const probabilityInput = document.createElement('input');
        probabilityInput.type = 'number';
        probabilityInput.placeholder = `Probability ${i + 1} (%)`;
        probabilityInput.min = '0';
        probabilityInput.max = '100';
        probabilityInput.required = true;
        participantsInputs.appendChild(probabilityInput);

        participants.push({ nameInput, probabilityInput });
        colors.push(getRandomColor()); // Generate a fixed color for each participant
        participantsInputs.appendChild(document.createElement('br'));
    }
}

function validateInputs() {
    let totalProbability = 0;
    for (const participant of participants) {
        const probability = parseInt(participant.probabilityInput.value);
        if (isNaN(probability)) {
            alert('Please enter valid probabilities.');
            return false;
        }
        totalProbability += probability;
    }
    if (totalProbability !== 100) {
        alert('Total probabilities must add up to 100%.');
        return false;
    }
    return true;
}

function createWheel() {
    if (!validateInputs()) {
        return;
    }

    const wheelCanvas = document.getElementById('wheelCanvas');
    const ctx = wheelCanvas.getContext('2d');
    let startAngle = 0;

    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    wheelSegments = [];

    participants.forEach((participant, index) => {
        const probability = parseInt(participant.probabilityInput.value);
        const sliceAngle = (probability / 100) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Save the angle range and participant for later use
        wheelSegments.push({ startAngle, endAngle, participant });

        ctx.beginPath();
        ctx.moveTo(wheelCanvas.width / 2, wheelCanvas.height / 2);
        ctx.arc(wheelCanvas.width / 2, wheelCanvas.height / 2, wheelCanvas.width / 2, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(wheelCanvas.width / 2, wheelCanvas.height / 2);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText(participant.nameInput.value, wheelCanvas.width / 2 - 20, 10);
        ctx.restore();

        startAngle = endAngle;
    });
}

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function spinWheel() {
    const wheelCanvas = document.getElementById('wheelCanvas');
    const ctx = wheelCanvas.getContext('2d');
    let angle = 0;
    const spinTimeTotal = Math.random() * 2000 + 3000; // Spin duration between 3 and 5 seconds
    let spinTime = spinTimeTotal;
    const spinAngleStart = Math.random() * 10 + 10; // Initial spin speed

    const drawWheel = () => {
        ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
        ctx.save();
        ctx.translate(wheelCanvas.width / 2, wheelCanvas.height / 2);
        ctx.rotate(angle * Math.PI / 180);
        ctx.translate(-wheelCanvas.width / 2, -wheelCanvas.height / 2);

        let startAngle = 0;
        participants.forEach((participant, index) => {
            const probability = parseInt(participant.probabilityInput.value);
            const sliceAngle = (probability / 100) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(wheelCanvas.width / 2, wheelCanvas.height / 2);
            ctx.arc(wheelCanvas.width / 2, wheelCanvas.height / 2, wheelCanvas.width / 2, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.translate(wheelCanvas.width / 2, wheelCanvas.height / 2);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(participant.nameInput.value, wheelCanvas.width / 2 - 20, 10);
            ctx.restore();

            startAngle = endAngle;
        });

        ctx.restore();
    };

    const rotateWheel = () => {
        angle += spinAngleStart * (spinTime / spinTimeTotal); // Gradually decrease speed
        drawWheel();
        if (spinTime > 0) {
            spinTime -= 16;
            requestAnimationFrame(rotateWheel);
        } else {
            const normalizedAngle = (angle % 360 + 360) % 360; // Normalize angle to be within 0-360
            const arrowAngle = (270 - normalizedAngle + 360) % 360; // Adjust based on arrow pointing downwards at 270 degrees
            let selectedParticipant = null;

            for (const segment of wheelSegments) {
                const startDeg = segment.startAngle * (180 / Math.PI);
                const endDeg = segment.endAngle * (180 / Math.PI);
                if (startDeg <= arrowAngle && arrowAngle < endDeg) {
                    selectedParticipant = segment.participant;
                    break;
                }
            }

            if (selectedParticipant) {
                document.getElementById('result').innerText = `Winner: ${selectedParticipant.nameInput.value}`;
            }
        }
    };

    rotateWheel();
}