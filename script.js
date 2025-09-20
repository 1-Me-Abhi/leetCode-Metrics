document.addEventListener("DOMContentLoaded", function() {

    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");
    const errorMessage = document.getElementById("error-message"); // Get the error message element

    // Validation no longer uses alert()
    function validateUsername(username) {
        errorMessage.textContent = ""; // Clear previous errors
        if (username.trim() === "") {
            errorMessage.textContent = "Username should not be empty.";
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        if (!regex.test(username)) {
            errorMessage.textContent = "Invalid username format.";
            return false;
        }
        return true;
    }

    async function fetchUserDetails(username) {
        errorMessage.textContent = ""; // Clear error on new search
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;

            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const targetUrl = 'https://leetcode.com/graphql/';
            
            const myHeaders = new Headers();
            myHeaders.append("content-type", "application/json");

            const graphql = JSON.stringify({
                query: "\n    query userSessionProgress($username: String!) {\n  allQuestionsCount {\n    difficulty\n    count\n  }\n  matchedUser(username: $username) {\n    submitStats {\n      acSubmissionNum {\n        difficulty\n        count\n        submissions\n      }\n      totalSubmissionNum {\n        difficulty\n        count\n        submissions\n      }\n    }\n  }\n}\n    ",
                variables: { "username": `${username}` }
            });
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: graphql,
            };

            const response = await fetch(proxyUrl + targetUrl, requestOptions);
            const parsedData = await response.json();

            // Check for errors returned by the GraphQL API (e.g., user not found)
            if (parsedData.errors) {
                throw new Error("User not found or LeetCode API error.");
            }
            
            displayUserData(parsedData);

        } catch (error) {
            // Update the error message element instead of the whole container
            errorMessage.textContent = error.message;
            // Clear old stats if a new search fails
            cardStatsContainer.innerHTML = "";
            updateProgress(0, 1, easyLabel, easyProgressCircle);
            updateProgress(0, 1, mediumLabel, mediumProgressCircle);
            updateProgress(0, 1, hardLabel, hardProgressCircle);
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, label, circle) {
        // Avoid division by zero if a category has 0 questions
        const progressDegree = total > 0 ? (solved / total) * 100 : 0;
        circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }

    // Rewritten to be more robust and includes the class name fix
    function displayUserData(parsedData) {
        errorMessage.textContent = ""; // Clear any previous errors on success
        
        const allQuestions = parsedData.data.allQuestionsCount;
        const userSubmissions = parsedData.data.matchedUser.submitStats.acSubmissionNum;
        const totalSubmissions = parsedData.data.matchedUser.submitStats.totalSubmissionNum;

        // Helper function to safely find data for a specific difficulty
        const findByDifficulty = (arr, difficulty) => arr.find(item => item.difficulty === difficulty) || { count: 0, submissions: 0 };

        // Total Questions
        const totalEasy = findByDifficulty(allQuestions, "Easy").count;
        const totalMedium = findByDifficulty(allQuestions, "Medium").count;
        const totalHard = findByDifficulty(allQuestions, "Hard").count;

        // Solved Questions
        const solvedEasy = findByDifficulty(userSubmissions, "Easy").count;
        const solvedMedium = findByDifficulty(userSubmissions, "Medium").count;
        const solvedHard = findByDifficulty(userSubmissions, "Hard").count;

        // Update Progress Circles
        updateProgress(solvedEasy, totalEasy, easyLabel, easyProgressCircle);
        updateProgress(solvedMedium, totalMedium, mediumLabel, mediumProgressCircle);
        updateProgress(solvedHard, totalHard, hardLabel, hardProgressCircle);

        // Card Data
        const cardsData = [
            { label: "Total Submissions", value: findByDifficulty(totalSubmissions, "All").submissions },
            { label: "Easy Submissions", value: findByDifficulty(totalSubmissions, "Easy").submissions },
            { label: "Medium Submissions", value: findByDifficulty(totalSubmissions, "Medium").submissions },
            { label: "Hard Submissions", value: findByDifficulty(totalSubmissions, "Hard").submissions },
        ];
        
        // Display Cards (with the "stat-card" class name fix)
        cardStatsContainer.innerHTML = cardsData.map(
            data =>
                `<div class="stat-card"> 
                    <h4>${data.label}</h4>
                    <p>${data.value}</p>
                 </div>`
        ).join("");
    }

    searchButton.addEventListener('click', function() {
        const username = usernameInput.value;
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

    usernameInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });
});