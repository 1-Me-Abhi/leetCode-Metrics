document.addEventListener("DOMContentLoaded", function () {
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

    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    // Function to handle fetching and displaying user data
    async function fetchUserDetails(username) { // Changed function name to be more descriptive
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            statsContainer.innerHTML = ''; // Clear previous stats before searching

            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const targetUrl = 'https://leetcode.com/graphql/';
            
            const myHeaders = new Headers();
            myHeaders.append("content-type", "application/json");

            const graphql = JSON.stringify({
                query: `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { "username": `${username}` }
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: graphql,
            };

            const response = await fetch(proxyUrl + targetUrl, requestOptions);
            
            if (!response.ok) {
                // If the response is not OK, LeetCode might have returned a specific error
                const errorData = await response.json();
                const errorMessage = errorData.errors ? errorData.errors[0].message : "Unable to fetch user details. Please check the username.";
                throw new Error(errorMessage);
            }
            
            const parsedData = await response.json();
            console.log("Logging data: ", parsedData);
            
            // Handle case where user is not found
            if (!parsedData.data || !parsedData.data.matchedUser) {
                throw new Error("Username not found on LeetCode.");
            }

            displayUserData(parsedData); // Correctly call the function to display data

        } catch (error) {
            statsContainer.innerHTML = `<p>${error.message}</p>`;
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }
    
    // This is a new function you need to add to handle the data
    function displayUserData(data) {
        const acSubmissions = data.data.matchedUser.submitStats.acSubmissionNum;
        const totalQuestions = data.data.allQuestionsCount;

        // Populate progress circles and labels
        acSubmissions.forEach(submission => {
            const total = totalQuestions.find(q => q.difficulty === submission.difficulty).count;
            const percentage = (submission.count / total) * 100;

            if (submission.difficulty === "Easy") {
                easyLabel.textContent = `${submission.count}/${total}`;
                easyProgressCircle.style.setProperty("--progress-degree", `${percentage}%`);
            } else if (submission.difficulty === "Medium") {
                mediumLabel.textContent = `${submission.count}/${total}`;
                mediumProgressCircle.style.setProperty("--progress-degree", `${percentage}%`);
            } else if (submission.difficulty === "Hard") {
                hardLabel.textContent = `${submission.count}/${total}`;
                hardProgressCircle.style.setProperty("--progress-degree", `${percentage}%`);
            }
        });

        // Clear existing cards
        cardStatsContainer.innerHTML = '';
        
        // Populate stats cards
        acSubmissions.forEach(submission => {
            const totalSubmissions = data.data.matchedUser.submitStats.totalSubmissionNum.find(ts => ts.difficulty === submission.difficulty).submissions;
            const card = document.createElement("div");
            card.className = "stat-card"; // Make sure your CSS has a .stat-card class
            card.innerHTML = `
                <h4>${submission.difficulty}</h4>
                <p>Solved: ${submission.count}</p>
                <p>Total Submissions: ${totalSubmissions}</p>
            `;
            cardStatsContainer.appendChild(card);
        });
    }

    // Event listener for the search button
    searchButton.addEventListener("click", function () {
        const username = usernameInput.value;
        console.log("User entered:", username);
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });
});