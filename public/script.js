
document.addEventListener("DOMContentLoaded", function() {
    fetchLanguages();
});

function fetchLanguages() {
    fetch('/languages')
    .then(response => response.json())
    .then(data => {
        displayLanguages(data);
    })
    .catch(error => console.error('Error fetching languages:', error));
}

function displayLanguages(languages) {
    var languageOptions = document.getElementById("language-options");

    languages.forEach(language => {
        var label = document.createElement("label");
        var input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("name", "language");
        input.setAttribute("value", language.language_id);
        label.appendChild(input);
        label.appendChild(document.createTextNode(language.language_name));
        label.appendChild(document.createElement("br"));
        languageOptions.appendChild(label);
    });
}

document.getElementById("next-btn").addEventListener("click", function() {
    var selectedLanguage = document.querySelector('input[name="language"]:checked');
    if (selectedLanguage) {
        fetchQuestions(selectedLanguage.value);
    } else {
        alert("Please select  language.");
    }
});

function fetchQuestions(languageId) {
    fetch(`/questions/${languageId}`)
    .then(response => response.json())
    .then(data => {
        displayQuestions(data);
    })
    .catch(error => console.error('Error fetching questions:', error));
}

function displayQuestions(questions) {
    var questionsContainer = document.getElementById("questions-container");
    questionsContainer.innerHTML = "";

    questions.forEach((question, index) => {
        var label = document.createElement("label");
        label.textContent = question.question_text;
        label.appendChild(document.createElement("br"));

        question.options.forEach(option => {
            var input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("name", `question_${question.question_id}`);
            input.setAttribute("value", option.option_id);
            label.appendChild(input);
            label.appendChild(document.createTextNode(option.option_text));
            label.appendChild(document.createElement("br"));
        });

        questionsContainer.appendChild(label);
    });

    questionsContainer.style.display = "block";
}

document.getElementById("submit-btn").addEventListener("click", function() {
    var selectedLanguage = document.querySelector('input[name="language"]:checked');
    if (!selectedLanguage) {
        alert("Please select .");
        return;
    }

    var formData = {
        languageId: selectedLanguage.value,
        responses: []
    };

    var questions = document.querySelectorAll('#questions-container label');
    questions.forEach(question => {
        var selectedOption = question.querySelector('input[type="radio"]:checked');
        if (!selectedOption) {
            alert("Please answer all questions.");
            return;
        }
        formData.responses.push({
            questionId: selectedOption.name.split('_')[1],
            optionId: selectedOption.value
        });
    });

    // Submit the form data
    submitForm(formData);
});

function submitForm(formData) {
    fetch('/submit-response', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            alert("Response submitted successfully!");
            location.reload(); // Reload the page after successful submission
        } else {
            alert("Failed to submit response.");
        }
    })
    .catch(error => console.error('Error submitting response:', error));
}
