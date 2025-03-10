// Global state management
const state = {
  currentState: 'start',
  apiKey: null,
  rubricItems: [],
  submissionImageSrc: null,
  results: null,
  processingTimeout: null
};

// Main function to initialize the extension
function initializeExtension() {
  // Create the UI container
  const container = document.createElement('div');
  container.id = 'homework-grader-extension';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    max-height: 80vh;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  document.body.appendChild(container);
  
  // Initial render based on current state
  renderUI();
}

// Render the appropriate UI based on current state
function renderUI() {
  const container = document.getElementById('homework-grader-extension');
  if (!container) return;
  
  let content = '';
  
  // Header for all states
  content += `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h2 style="margin: 0; font-size: 18px;">Homework Grader</h2>
      <span style="background: #eee; border-radius: 4px; padding: 3px 6px; font-size: 12px;">${state.currentState}</span>
    </div>
  `;
  
  // Content based on current state
  switch (state.currentState) {
    case 'start':
      content += renderStartState();
      break;
    case 'reading':
      content += renderReadingState();
      break;
    case 'query':
      content += renderQueryState();
      break;
    case 'display':
      content += renderDisplayState();
      break;
  }
  
  container.innerHTML = content;
  
  // Add event listeners after rendering
  addEventListeners();
}

// Render the Start state UI
function renderStartState() {
  return `
    <div>
      <p>Enter your OpenAI API key to start grading:</p>
      <input 
        type="password" 
        id="api-key-input" 
        placeholder="sk-..." 
        value="${state.apiKey || ''}" 
        style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;"
      />
      <button 
        id="start-button" 
        style="background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%;"
      >
        Start Grading
      </button>
    </div>
  `;
}

// Render the Reading state UI
function renderReadingState() {
  return `
    <div>
      <p>Reading page content...</p>
      <div style="width: 100%; height: 4px; background-color: #f3f3f3; border-radius: 4px; overflow: hidden;">
        <div id="progress-bar" style="width: 50%; height: 100%; background-color: #4CAF50;"></div>
      </div>
    </div>
  `;
}

// Render the Query state UI
function renderQueryState() {
  return `
    <div>
      <p>Querying OpenAI API...</p>
      <div style="width: 100%; height: 4px; background-color: #f3f3f3; border-radius: 4px; overflow: hidden;">
        <div id="progress-bar" style="width: 75%; height: 100%; background-color: #4CAF50;"></div>
      </div>
    </div>
  `;
}

// Render the Display state UI
function renderDisplayState() {
  if (!state.results || !state.rubricItems) {
    return `<p>Error: No results to display</p>`;
  }
  
  let content = `
    <div>
      <p>Grading Results:</p>
      <div style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
  `;
  
  // Display each rubric item with its result
  state.results.rubricEvaluations.forEach((result, index) => {
    const rubricItem = state.rubricItems[index];
    const backgroundColor = result.applied ? '#e6f7e6' : '#fff';
    const textDecoration = result.applied ? 'none' : 'line-through';
    const fontWeight = result.applied ? 'bold' : 'normal';
    
    content += `
      <div style="padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: ${backgroundColor};">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: ${fontWeight}; text-decoration: ${textDecoration};">${rubricItem.description}</span>
          <span>${result.applied ? rubricItem.points : 0} / ${rubricItem.points} pts</span>
        </div>
        ${result.reason ? `<p style="margin: 5px 0 0; font-size: 12px; color: #666;">${result.reason}</p>` : ''}
      </div>
    `;
  });
  
  // Add overall feedback
  content += `
      <div style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; margin-bottom: 8px;">
        <h3 style="margin-top: 0; font-size: 14px;">Overall Feedback:</h3>
        <p style="margin: 5px 0 0; font-size: 13px;">${state.results.overallFeedback}</p>
      </div>
  `;
  
  content += `
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button 
          id="apply-grades-button" 
          style="background-color: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;"
        >
          Apply Grades
        </button>
        <button 
          id="reset-button" 
          style="background-color: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;"
        >
          Reset
        </button>
      </div>
    </div>
  `;
  
  return content;
}

// Add event listeners based on current state
function addEventListeners() {
  switch (state.currentState) {
    case 'start':
      const startButton = document.getElementById('start-button');
      if (startButton) {
        startButton.addEventListener('click', handleStartButtonClick);
      }
      break;
    case 'display':
      const applyGradesButton = document.getElementById('apply-grades-button');
      if (applyGradesButton) {
        applyGradesButton.addEventListener('click', handleApplyGrades);
      }
      
      const resetButton = document.getElementById('reset-button');
      if (resetButton) {
        resetButton.addEventListener('click', handleReset);
      }
      break;
  }
}

// Handler for the Start button click
function handleStartButtonClick() {
  const apiKeyInput = document.getElementById('api-key-input');
  if (!apiKeyInput) return;
  
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert('Please enter a valid OpenAI API key');
    return;
  }
  
  // Store the API key and transition to Reading state
  state.apiKey = apiKey;
  transitionToState('reading');
}

// Handler for the Apply Grades button click
function handleApplyGrades() {
  // Apply grades based on results
  applyGradesToPage();
  
  // Set a timeout to move to the next submission after 5 seconds
  state.processingTimeout = setTimeout(() => {
    goToNextSubmission();
    transitionToState('reading');
  }, 5000);
}

// Handler for the Reset button click
function handleReset() {
  // Clear timeout if it exists
  if (state.processingTimeout) {
    clearTimeout(state.processingTimeout);
    state.processingTimeout = null;
  }
  
  // Reset to start state
  state.currentState = 'start';
  state.results = null;
  state.rubricItems = [];
  state.submissionImageSrc = null;
  renderUI();
}

// Transition to a new state and perform necessary actions
function transitionToState(newState) {
  state.currentState = newState;
  renderUI();
  
  // Perform actions based on the new state
  switch (newState) {
    case 'reading':
      readPageContent();
      break;
    case 'query':
      queryOpenAI();
      break;
  }
}

// Read rubric items and submission image from the page
function readPageContent() {
  try {
    // Get submission image URL using your provided code
    let viewports = document.getElementsByClassName("pv--viewport");
    if (viewports.length !== 1) {
      throw new Error("Got multiple/no viewport");
    }
    
    let pages = viewports[0].getElementsByTagName("img");
    if (pages.length !== 1) {
      throw new Error("Got multiple/no pages");
    }
    
    state.submissionImageSrc = pages[0].src;
    
    // Get rubric items using your provided code
    let rubricItemElements = document.getElementsByClassName("rubricItem--pointsAndDescription");
    if (rubricItemElements.length === 0) {
      throw new Error("No rubric items found");
    }
    
    state.rubricItems = [];
    
    for (const rubricItem of rubricItemElements) {
      // Get points
      let rubricPointElement = rubricItem.getElementsByTagName("button");
      if (rubricPointElement.length !== 1) {
        throw new Error("Multiple/no buttons for rubric item");
      }
      
      let points = parseInt(rubricPointElement[0].textContent);
      
      // Get rubric description
      let pointText = rubricItem.getElementsByClassName("markdownText")[0].textContent;
      
      state.rubricItems.push({
        description: pointText,
        points: points
      });
    }
    
    // Validate that we have enough information
    if (!state.submissionImageSrc) {
      throw new Error("Could not find submission image");
    }
    
    if (state.rubricItems.length === 0) {
      throw new Error("Could not find any rubric items");
    }
    
    // Transition to Query state
    transitionToState('query');
    
  } catch (error) {
    console.error("Error reading page content:", error);
    alert(`Error reading page: ${error.message}`);
    handleReset();
  }
}

// Query the OpenAI API directly with fetch
async function queryOpenAI() {
  try {
    if (!state.apiKey || !state.submissionImageSrc || !state.rubricItems.length) {
      throw new Error("Missing required data for API query");
    }
    
    // Convert image to base64
    // const imageBase64 = await fetchImageAsBase64(state.submissionImageSrc);
    
    // Prepare the user prompt
    const userPrompt = `
      Please grade this homework submission according to the following rubric items:
      ${state.rubricItems.map((item, index) => 
        `${index + 1}. ${item.description} (${item.points} points)`).join('\n')}
      
      For each rubric item, determine if it should be applied (true) or not (false).
      Provide a brief reason for each decision.
      Also include overall feedback on the submission.
    `;
    
    // Define the expected response format as a JSON schema
    const responseSchema = {
      type: "object",
      properties: {
        rubricEvaluations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              applied: {
                type: "boolean",
                description: "Whether the rubric item should be applied based on the submission"
              },
              reason: {
                type: "string",
                description: "A brief explanation of why this decision was made"
              }
            },
            required: ["applied", "reason"]
            additionalProperties: false,
          },
          description: "Evaluation for each rubric item"
        },
        overallFeedback: {
          type: "string",
          description: "Overall feedback on the submission"
        }
      },
      required: ["rubricEvaluations", "overallFeedback"],
      additionalProperties: false,
    };
    
    // Prepare the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: "You are an expert teacher assistant that helps grade student homework submissions."
          },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `${state.submissionImageSrc}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "grade_response",
            schema: responseSchema,
            strict: true
          }
        },
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Parse the response content
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid API response format");
    }
    
    // Parse the JSON string from the API response
    const parsedContent = JSON.parse(data.choices[0].message.content);
    
    // Validate the response has the expected structure
    if (!parsedContent.rubricEvaluations || !Array.isArray(parsedContent.rubricEvaluations) || 
        typeof parsedContent.overallFeedback !== 'string') {
      throw new Error("API response does not match expected format");
    }
    
    // Ensure the number of evaluations matches the number of rubric items
    if (parsedContent.rubricEvaluations.length !== state.rubricItems.length) {
      throw new Error(`API returned ${parsedContent.rubricEvaluations.length} evaluations, but we have ${state.rubricItems.length} rubric items`);
    }
    
    // Validate each evaluation
    parsedContent.rubricEvaluations.forEach(evaluation => {
      if (typeof evaluation.applied !== 'boolean' || typeof evaluation.reason !== 'string') {
        throw new Error("Invalid evaluation format in API response");
      }
    });
    
    // Store results
    state.results = parsedContent;
    
    // Transition to Display state
    transitionToState('display');
    
  } catch (error) {
    console.error("Error querying OpenAI API:", error);
    alert(`Error querying OpenAI: ${error.message}`);
    handleReset();
  }
}

// Helper function to fetch an image and convert it to base64
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}

// Apply grades to the page based on results
function applyGradesToPage() {
  try {
    // Try to find rubric grade applied buttons
    let rubricGradeAppliedButtons = document.getElementsByClassName("rubricItem--key-applied");
    
    // Clear previously applied grades if any exist
    if (rubricGradeAppliedButtons && rubricGradeAppliedButtons.length > 0) {
      for (let i = 0; i < rubricGradeAppliedButtons.length; i++) {
        rubricGradeAppliedButtons[i].click();
      }
    }

    // Get rubric grade buttons
    let rubricGradeButtons = document.getElementsByClassName("rubricItem--key");
    
    // Verify we have the right number of buttons
    if (rubricGradeButtons.length !== state.rubricItems.length) {
      throw new Error(`Number of buttons (${rubricGradeButtons.length}) doesn't match number of rubric items (${state.rubricItems.length})`);
    }
    
    // Click buttons for applied rubric items
    state.results.rubricEvaluations.forEach((result, index) => {
      if (result.applied) {
        rubricGradeButtons[index].click();
      }
    });
    
    //// Add overall feedback if there's a comment field
    //const commentField = document.querySelector('textarea[placeholder="Add a comment..."]');
    //if (commentField && state.results.overallFeedback) {
    //  commentField.value = state.results.overallFeedback;
    //
    //  // Trigger input event to register the change
    //  const event = new Event('input', { bubbles: true });
    //  commentField.dispatchEvent(event);
    //}
    
  } catch (error) {
    console.error("Error applying grades:", error);
    alert(`Error applying grades: ${error.message}`);
  }
}

// Go to the next submission
function goToNextSubmission() {
  try {
    let nextButton = document.getElementsByClassName("js-nextUngraded");
    if (nextButton.length !== 1) {
      throw new Error("Multiple/no next buttons found");
    }
    
    nextButton[0].click();
    
  } catch (error) {
    console.error("Error navigating to next submission:", error);
    alert(`Error going to next submission: ${error.message}`);
    handleReset();
  }
}

// Initialize the extension when the page is fully loaded
window.addEventListener('load', initializeExtension);

// Listen for page changes that might indicate a new submission has loaded
let previousUrl = window.location.href;
const urlChangeCallback = () => {
  if (window.location.href !== previousUrl) {
    previousUrl = window.location.href;
    
    // If we're in display state, go back to reading
    if (state.currentState === 'display') {
      // Clear any existing timeout
      if (state.processingTimeout) {
        clearTimeout(state.processingTimeout);
        state.processingTimeout = null;
      }
      
      // Transition to reading state
      transitionToState('reading');
    }
  }
};

// Check for URL changes
setInterval(urlChangeCallback, 1000);
