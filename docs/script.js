let deck = [];
let playerHand = [];
let dealerHand = [];
let playerScore = 0;
let dealerScore = 0;
let triggerBet = 0;
let mainBet = 0;
let sideBet = 0;
let progressiveBet = 0; // Progressive bet amount
let payoutMultiplier = 1;
let sideBetWon = false;
let progressiveWon = false; // Track if progressive jackpot is won
let pulseShieldUsed = false; // Track if the Pulse Shield has been used
let blackjackType = ""; // Track if it's a 2-card or 3-card blackjack
let doubleDownUsed = false; // Track if double down is used

// Player balance starts with $5000
let playerBalance = 5000;

function createDeck() {
  const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const values = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCard(deck) {
  return deck.pop();
}

function calculateScore(hand) {
  let score = 0;
  let aceCount = 0;

  for (let card of hand) {
    if (["K", "Q", "J"].includes(card.value)) {
      score += 10;
    } else if (card.value === "A") {
      aceCount += 1;
      score += 11;
    } else {
      score += parseInt(card.value);
    }
  }

  while (score > 21 && aceCount) {
    score -= 10;
    aceCount -= 1;
  }

  return score;
}

function startGame() {
  // Ensure player has enough balance to place bets
  mainBet = parseInt(document.getElementById("main-bet").value);
  triggerBet = parseInt(document.getElementById("trigger-bet").value);
  sideBet = parseInt(document.getElementById("side-bet").value);
  progressiveBet = parseInt(document.getElementById("progressive-bet").value); // Get the Progressive Bet

  let totalBet = mainBet + triggerBet + sideBet + progressiveBet;

  if (totalBet > playerBalance) {
    alert("You don't have enough balance to place this bet.");
    return;
  }

  resetButtons(); // Reset buttons before dealing a new round
  resetBoard(); // Reset the board for the new round
  deck = createDeck();
  shuffleDeck(deck);

  playerHand = [dealCard(deck), dealCard(deck)];
  dealerHand = [dealCard(deck), dealCard(deck)];

  playerScore = calculateScore(playerHand);
  dealerScore = calculateScore(dealerHand);

  sideBetWon = checkSideBet(); // Check if side bet condition is met
  progressiveWon = checkProgressive(); // Check if the player wins the progressive jackpot
  checkMultiplier(); // Check if the dealer's hand activates the multiplier
  checkBlackjack(); // Check if the player has Blackjack

  pulseShieldUsed = false; // Reset Pulse Shield usage
  doubleDownUsed = false; // Reset double down usage

  // Deduct the total bet from the player's balance
  playerBalance -= totalBet;
  updateBalanceDisplay();

  // Check if Pulse Shield should be enabled after initial deal
  checkPulseShield();

  updateBoard();
  enableButtons(); // Enable buttons for player action
}

function hit() {
  if (pulseShieldUsed) {
    alert(
      "You have already used the Pulse Shield. You cannot draw more cards."
    );
    return; // Prevent further hits if Pulse Shield has been used
  }

  playerHand.push(dealCard(deck));
  playerScore = calculateScore(playerHand);

  // Check if Pulse Shield should be enabled after hitting
  checkPulseShield();

  updateBoard();

  if (playerScore > 21 && !pulseShieldUsed) {
    endGame("Player busts!", true); // Round automatically restarts after bust
  }
}

function stand() {
  dealerTurn();
}

function doubleDown() {
  if (!doubleDownUsed) {
    // Ensure player has enough balance to double down
    if (mainBet > playerBalance) {
      alert("You don't have enough balance to double down.");
      return;
    }

    mainBet *= 2; // Double the player's main bet
    alert(`You doubled your bet to $${mainBet}.`);

    playerHand.push(dealCard(deck)); // Draw one more card
    playerScore = calculateScore(playerHand);

    doubleDownUsed = true; // Mark double down as used
    updateBoard();

    if (playerScore > 21) {
      endGame("Player busts after doubling down!", true); // End the game if bust after double down
    } else {
      alert("Your turn is over after doubling down.");
      dealerTurn(); // End player's turn after doubling down and move to dealer's turn
    }
  }
}

function dealerTurn() {
  // Dealer hits until they reach 17 or higher
  while (dealerScore < 17) {
    dealerHand.push(dealCard(deck));
    dealerScore = calculateScore(dealerHand);
  }

  updateBoard(true); // Show the full dealer hand

  // Check result of the game after the dealer's turn
  if (dealerScore > 21) {
    endGame("Dealer busts! Player wins.", true); // Automatically restart after win
    calculatePayouts(true);
  } else if (playerScore > dealerScore) {
    endGame("Player wins!", true); // Automatically restart after win
    calculatePayouts(true);
  } else if (playerScore === dealerScore) {
    endGame("It's a tie!", true); // Automatically restart after tie
    calculatePayouts(false);
  } else {
    endGame("Dealer wins!", true); // Automatically restart after loss
    calculatePayouts(false);
  }
}

function activatePulseShield() {
  if (!pulseShieldUsed && playerScore >= 17) {
    alert("Pulse Shield activated! You may draw one more card.");

    let drawnCard = dealCard(deck); // Draw one more card
    let newScore = calculateScore(playerHand.concat(drawnCard)); // Calculate score with the new card

    if (newScore > 21) {
      alert(
        "The drawn card would have caused you to bust. The card is discarded."
      );
    } else {
      playerHand.push(drawnCard); // Only add the card if it doesn't cause a bust
      playerScore = newScore;
    }

    pulseShieldUsed = true; // Mark the shield as used
    document.getElementById("pulse-shield").disabled = true; // Disable the button after use
    document.getElementById("hit").disabled = true; // Disable further hits after using the shield

    updateBoard();

    if (playerScore <= 21) {
      alert("Your turn is over. It's the dealer's turn now.");
      dealerTurn(); // Automatically proceed to the dealer's turn after using the shield
    } else {
      endGame("Player busts even after using Pulse Shield.", true); // Round automatically restarts
    }
  }
}

function updateBoard(showDealerFullHand = false) {
  document.getElementById("player-cards").innerText = playerHand
    .map((card) => `${card.value} of ${card.suit}`)
    .join(", ");

  if (showDealerFullHand) {
    // Show all dealer cards at the end of the round
    document.getElementById("dealer-cards").innerText = dealerHand
      .map((card) => `${card.value} of ${card.suit}`)
      .join(", ");
  } else {
    // Show only the first dealer card
    document.getElementById(
      "dealer-cards"
    ).innerText = `${dealerHand[0].value} of ${dealerHand[0].suit}, Face Down`;
  }
}

function checkMultiplier() {
  if (dealerScore >= 19 && triggerBet > 0) {
    payoutMultiplier = 4; // Activate 4x payout on Trigger Bet
    alert("Multiplier Activated! You can win 4x on your Trigger Bet.");
  }
}

function checkSideBet() {
  // Side Bet: If the player is dealt two face cards (Jack, Queen, King)
  if (
    ["J", "Q", "K"].includes(playerHand[0].value) &&
    ["J", "Q", "K"].includes(playerHand[1].value)
  ) {
    return true;
  }
  return false;
}

// Check if the player wins the Progressive Jackpot
function checkProgressive() {
  if (playerHand.length === 3 && progressiveBet > 0) {
    let firstCardColor =
      playerHand[0].suit === "Hearts" || playerHand[0].suit === "Diamonds"
        ? "red"
        : "black";
    let allSameColor = playerHand.every((card) => {
      return card.suit === "Hearts" || card.suit === "Diamonds"
        ? firstCardColor === "red"
        : firstCardColor === "black";
    });
    if (allSameColor) {
      return true; // Win the progressive jackpot if all 3 cards are the same color
    }
  }
  return false;
}

function checkBlackjack() {
  if (playerScore === 21) {
    if (playerHand.length === 2) {
      blackjackType = "2-card"; // Standard Blackjack
    } else if (playerHand.length === 3) {
      blackjackType = "3-card"; // 3-card Blackjack
    }
  } else {
    blackjackType = "";
  }
}

// New function to check if Pulse Shield should be enabled
function checkPulseShield() {
  if (triggerBet > 0 && playerScore >= 17 && !pulseShieldUsed) {
    document.getElementById("pulse-shield").disabled = false;
  } else {
    document.getElementById("pulse-shield").disabled = true;
  }
}

// Calculate Payouts based on the provided structure
function calculatePayouts(playerWins) {
  let totalPayout = 0;

  if (playerWins) {
    if (blackjackType === "2-card") {
      totalPayout += mainBet * 3; // 2:1 for Blackjack (2 cards)
    } else if (blackjackType === "3-card") {
      totalPayout += mainBet * 4; // 3:1 for Blackjack (3 cards)
    } else {
      totalPayout += mainBet * 2; // Standard win pays 1:1
    }

    // Handle Trigger Bet payouts
    if (triggerBet > 0) {
      if (payoutMultiplier === 4) {
        if (pulseShieldUsed) {
          totalPayout += triggerBet * 6; // Trigger Bet (Multiplier + Pulse Shield)
        } else {
          totalPayout += triggerBet * 4; // Trigger Bet (Multiplier only)
        }
      } else if (pulseShieldUsed) {
        totalPayout += triggerBet * 2; // Trigger Bet (Pulse Shield only) - 1:1 payout
      }
    }

    if (sideBetWon) {
      totalPayout += sideBet * 4; // Side Bet payout is 3:1
    }

    if (progressiveWon) {
      totalPayout += progressiveBet * 100; // Simulating the full jackpot payout
      alert("Congratulations! You won the Pulse Vault Progressive Jackpot!");
    }

    // Add the total winnings to the player's balance
    playerBalance += totalPayout;
    updateBalanceDisplay();
  }

  // Show total payout to the player
  document.getElementById("results").innerText = `Payout: $${totalPayout}`;
}

function resetButtons() {
  document.getElementById("hit").disabled = true;
  document.getElementById("stand").disabled = true;
  document.getElementById("double-down").disabled = true; // Disable double down after use
  document.getElementById("pulse-shield").disabled = true;
  document.getElementById("results").innerText = ""; // Clear results area
}

function enableButtons() {
  document.getElementById("hit").disabled = false;
  document.getElementById("stand").disabled = false;
  document.getElementById("double-down").disabled = false; // Enable double down at start of round
}

function resetBoard() {
  document.getElementById("player-cards").innerText = "";
  document.getElementById("dealer-cards").innerText = "";
}

// Function to update the balance display on the screen
function updateBalanceDisplay() {
  document.getElementById("balance").innerText = `Balance: $${playerBalance}`;
}

function endGame(message, autoRestart) {
  document.getElementById("results").innerText = message;
  resetButtons();

  if (autoRestart) {
    setTimeout(() => {
      // Prompt player to place new bets after 2 seconds
      document.getElementById("results").innerText =
        "Place new bets to start the next round.";
      resetBoard(); // Clear the board for the next round
      document.getElementById("deal").disabled = false; // Re-enable the Deal button
    }, 3000); // Slight delay before resetting the round to show dealer's hand
  }
}

// Attach event listeners after the DOM is loaded
document.getElementById("deal").addEventListener("click", startGame);
document.getElementById("hit").addEventListener("click", hit);
document.getElementById("stand").addEventListener("click", stand);
document.getElementById("double-down").addEventListener("click", doubleDown); // Add event listener for Double Down button
document
  .getElementById("pulse-shield")
  .addEventListener("click", activatePulseShield); // Add event listener for Pulse Shield button

// Initialize balance display
updateBalanceDisplay();
