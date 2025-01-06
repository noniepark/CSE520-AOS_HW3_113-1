let userId = null;
let selectedProfileId = null;

// Store participants, colors, and wheel segments
let participants = [];
let colors = [];
let wheelSegments = [];

// Join user
async function joinUser() {
    const username = document.getElementById('username').value;
    const response = await fetch('http://localhost:3000/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });

    const data = await response.json();
    userId = data.userId;

    document.getElementById('profileSection').style.display = 'block';
    loadProfiles();
}

// Generate participant inputs
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
        colors.push(getRandomColor());
        participantsInputs.appendChild(document.createElement('br'));
    }
}

// prompt for profile sharing
async function promptShareProfile(profileId) {
    const targetUsername = prompt('Enter the username of the person to share this profile with:');
    if (!targetUsername) {
        alert('Sharing canceled.');
        return;
    }

    const response = await fetch('http://localhost:3000/share-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, targetUsername }),
    });

    const result = await response.json();

    if (response.ok) {
        alert(result.message);
    } else {
        alert(`Failed to share profile: ${result.message}`);
    }
}


// Save profile
async function saveProfile() {
    const profileName = document.getElementById('profileName').value;
    const choices = participants.map(p => p.nameInput.value);
    const probabilities = participants.map(p => p.probabilityInput.value);

    const response = await fetch('http://localhost:3000/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profileName, choices, probabilities }),
    });

    if (response.ok) {
        alert('Profile saved successfully!');
        loadProfiles();
    } else {
        alert('Error saving profile.');
    }

    // Ensure the form and "Create Wheel" button remain intact
    document.getElementById('inputForm').style.display = 'block';
}

// Load a specific profile
function loadProfile(profile) {
    document.getElementById('profileName').value = profile.profile_name;

    const choices = JSON.parse(profile.choices);
    const probabilities = JSON.parse(profile.probabilities);

    document.getElementById('numParticipants').value = choices.length;
    generateInputs();

    choices.forEach((choice, index) => {
        participants[index].nameInput.value = choice;
        participants[index].probabilityInput.value = probabilities[index];
    });

    // Ensure the "Create Wheel" button is visible
    document.getElementById('createWheelButton').style.display = 'inline-block';
}


// Update to support profile sharing (No profile sharing)
/* 
async function loadProfiles() {
     const response = await fetch(`http://localhost:3000/profiles/${userId}`);
    const profiles = await response.json();

    const profileList = document.getElementById('profileList');
    profileList.innerHTML = '';
    selectedProfileId = null;

    profiles.forEach(profile => {
        const li = document.createElement('li');
        li.innerText = profile.profile_name;
        li.style.cursor = 'pointer';

        li.onclick = () => {
            document.querySelectorAll('#profileList li').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');
            selectedProfileId = profile.id;

            // Show the Load Profile button
            document.getElementById('loadProfileButton').style.display = 'inline-block';
        };

        profileList.appendChild(li);
    });
}
*/

// Update to support profile sharing
async function loadProfiles() {
    const response = await fetch(`http://localhost:3000/profiles/${userId}`);
    const profiles = await response.json();

    const profileList = document.getElementById('profileList');
    profileList.innerHTML = '';
    selectedProfileId = null;

    profiles.forEach(profile => {
        const li = document.createElement('li');
        li.innerText = profile.profile_name;
        li.style.cursor = 'pointer';

        // Add onclick handler for selecting a profile
        li.onclick = () => {
            document.querySelectorAll('#profileList li').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');
            selectedProfileId = profile.id;

            // Show the Load Profile button
            document.getElementById('loadProfileButton').style.display = 'inline-block';
        };

        // Create the Share button
        const shareButton = document.createElement('button');
        shareButton.innerText = 'Share';
        shareButton.style.marginLeft = '10px';
        shareButton.onclick = (e) => {
            e.stopPropagation(); // Prevent profile selection when clicking "Share"
            promptShareProfile(profile.id);
        };

        li.appendChild(shareButton);
        profileList.appendChild(li);
    });
}



async function loadSelectedProfile() {
    if (!selectedProfileId) {
        alert('Please select a profile to load.');
        return;
    }

    const response = await fetch(`http://localhost:3000/profiles/${userId}`);
    const profiles = await response.json();

    // Find the selected profile
    const profile = profiles.find(p => p.id === selectedProfileId);

    if (profile) {
        loadProfile(profile);

        // Hide the "Load Profile" button after loading
        document.getElementById('loadProfileButton').style.display = 'none';
    } else {
        alert('Failed to load profile. Please try again.');
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

// Original createWheel function
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

    //alert('Wheel created! You can now spin it.');
}


// Get random color
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
