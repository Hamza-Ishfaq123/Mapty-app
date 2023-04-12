'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');



class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;//in km
        this.duration = duration;//in min

    }
    setDiscription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    };
};

class running extends Workout {
    type = "running";

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this.setDiscription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this.setDiscription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    };
}

const run1 = new running([39, -12], 10, 60, 10);

class App {
    //*private instance fields
    #map;
    #mapEvent;
    #workouts = [];
    //*constructor
    constructor() {
        this._getPosition();
        //get Data from local storage
        this._getLocalStorage();

        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    };

    //*instance methods 
    _getPosition() {
        //^Geolocation API. It is a browser API
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
            alert("your positon can't be fetched for some reason");
        });
    }

    _loadMap(positon) {
        const { latitude } = positon.coords;
        const { longitude } = positon.coords;
        //^ create a MAP URL based on my latitude and longitude.then we pass that URL to third party library "leaflet" to load the map.
        const link = `https://www.google.com/maps/@${latitude},${longitude}`;
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on("click", this._showForm.bind(this));
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(e) {
        this.#mapEvent = e;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    _hideForm() {
        form.classList.add("hidden");
        inputDistance.value = inputDuration.value = inputCadence.value = "";
    }

    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle('form__row--hidden');
        inputCadence.closest(".form__row").classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();
        //Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //if workout running,create running object
        if (type === "running") {
            const cadence = +inputCadence.value;
            //check if data is valid
            // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)) {
            //     return alert("hello");
            // }
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) {
                alert("Inputs must be positive numbers")
            }
            workout = new running([lat, lng], distance, duration, cadence);
        }
        //if workout cycling,create cycling object
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            //check if data is valid
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) {
                alert("Inputs must be positive numbers");
            }
            workout = new cycling([lat, lng], distance, duration, elevation);
        }
        //Add new object to workout array
        this.#workouts.push(workout);


        //render workout on Map 
        this._renderWorkoutMarker(workout);

        //rander workout on list 
        this._renderWorkout(workout);

        //hide the form  //clear input fields
        this._hideForm();
        //store workouts in the local storage
        this._setLocalStorage();
    };

    //function to render workouts on map
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 300,
                minWidth: 50,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === "running" ? "" : ""} ${workout.description})`)
            .openPopup();
    }

    //function to render workouts on list
    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === "running" ? "run" : "cycle"}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;

        if (workout.type === "running") {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
              </li>`
        };
        if (workout.type === "cycling") {
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>`
        };

        form.insertAdjacentHTML("afterend", html);
        // this.logWorkouts();
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest(".workout");
        // console.log(workoutEl); 
        if (!workoutEl) return; //guard clause

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, 13, {
            animate: true,
            pan: {
                duration: 1
            }
        })
    };
    // set local storage to all workouts
    _setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));
        console.log(data);

        //If no data is present in local Api
        if (!data) return;
        this.#workouts = data; //[objects]
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })

    }
    reset() {
        localStorage.removeItem("workouts");
        location.reload();
    }
};

const app = new App();




