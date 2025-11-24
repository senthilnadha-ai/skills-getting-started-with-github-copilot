document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // normalize participants into an array regardless of incoming shape
  function normalizeParticipants(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "object") {
      // if it's a map/object of participants, return its values
      return Object.values(raw);
    }
    // single scalar
    return [raw];
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantsArr = normalizeParticipants(details && details.participants);
        const maxParticipants = typeof (details && details.max_participants) === "number"
          ? details.max_participants
          : null;
        const spotsLeft = maxParticipants !== null ? Math.max(0, maxParticipants - participantsArr.length) : "—";

        // Basic info
        const title = document.createElement("h4");
        title.textContent = name;
        const desc = document.createElement("p");
        desc.textContent = details && details.description ? details.description : "";
        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details && details.schedule ? details.schedule : "TBD"}`;
        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} ${maxParticipants !== null ? "spots left" : ""}`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section
        const participantsWrap = document.createElement("div");
        participantsWrap.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsWrap.appendChild(participantsHeading);

        const ul = document.createElement("ul");
        ul.className = "participant-list";

        if (participantsArr.length > 0) {
          participantsArr.forEach((p) => {
            // derive display name and initials
            let display = "";
            if (typeof p === "string") {
              display = p.includes("@") ? p.split("@")[0] : p;
            } else if (typeof p === "object" && p !== null) {
              display = p.name || p.email || JSON.stringify(p);
            } else {
              display = String(p);
            }

            const initials = (display
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map(s => s[0].toUpperCase())
              .join("")) || display.slice(0,2).toUpperCase();

            const li = document.createElement("li");
            li.className = "participant";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            avatar.textContent = initials;

            const text = document.createElement("span");
            text.className = "participant-name";
            text.textContent = " " + display;

            li.appendChild(avatar);
            li.appendChild(text);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsWrap.appendChild(ul);
        activityCard.appendChild(participantsWrap);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
