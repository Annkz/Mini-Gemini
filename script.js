const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");


let userMessage = null;
let isResponseGenerating = false;

//API configuration
const API_KEY = "AIzaSyCQ9c8j8b006uIwnD1CVSSlkCTRwGgYxTw";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;


const loadLocalstorageData = ()=>{
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    //Restore saved chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats)
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
}

loadLocalstorageData();

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message",...classes);
    div.innerHTML = content;
    return div;
}

// show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    // Append each word to the text element with a space
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    
      incomingMessageDiv.querySelector(".icon").classList.add("hide");

    // If all words have been appended, clear the interval
    if (currentWordIndex === words.length){
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); //save chats to localStorage
    } 
    chatList.scrollTo(0,chatList.scrollHeight);//scroll to the bottom
  }, 75);
};

// Fetch response from the API based on user message
const generateAPIresponse = async (incomingMessageDiv) => {

    const textElement = incomingMessageDiv.querySelector(".text"); //Get text element

  // send a POST request to the API with the user's message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.error.message);

    // Get the api response text and remove asterisks
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
    
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);

  } catch (error) {
    isResponseGenerating = false;
    textElement.innerHTML = error.message;
    textElement.classList.add("error")
  } finally{
    incomingMessageDiv.classList.remove("loading"); //Remove loading animation when response is received
  }
};

// Show loading animation while waiting for the api response
const showLoadingAnimation = ()=>{
    const html = ` <div class="message-content">
            <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <span onclick="copyMessage(this)" class=" icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
    generateAPIresponse(incomingMessageDiv);
}

// copy message Text to the clipboard
const copyMessage = (copyIcon) =>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText)
    copyIcon.innerText = "done"; //show tick icon
    setTimeout(()=>{
        copyIcon.innerText = "content_copy";
    },1000) //Revert icon after 1 second
}

// Handle sending outgoing chat messages
const handleOutgoingChat = () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; //Exit if there is no message

    isResponseGenerating = true;

    const html = ` <div class="message-content">
                <img src="images/user.jpg" alt="User Image" class="avatar">
                <p class="text"></p>
            </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); //Clear input field
    chatList.scrollTo(0, chatList.scrollHeight);//Scroll to the bottom
    document.body.classList.add("hide-header") //hide the header once chat start
    setTimeout(showLoadingAnimation, 500) //show loading animation after a delay
}

//Getting the text element of the clicked suggestion and passing its content as userMessage
// Set user message and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click",()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
})

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", ()=>{
    const isLightMode = document.body.classList.toggle("light_mode"); //Toggle light_mode class
    localStorage.setItem("themeColor", isLightMode ? "light_mode" :"dark_mode")
    toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";
})

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click",()=>{
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats")
        loadLocalstorageData();
    }
})

// prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit",(e)=>{
    e.preventDefault();

    handleOutgoingChat()
})