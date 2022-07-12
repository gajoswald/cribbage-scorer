const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const suits = ["S","C","H","D"];
let deck = shuffleDeck();
let remainingCombos = [];

function shuffleDeck() {
  return ranks.reduce( (all, rank, index) => {
    return [...all, ...suits.reduce( (arr,suit) => {
      return [...arr, {
        str: `${rank}${suit}`,
        suit, 
        rank: index,
        value: index <= 9 ? index + 1 : 10
      }]
    }, [])]
  }, [])
}

function randomRemove( array ) {
  return array.splice(int(random(array.length)),1)[0];
}

function byRank(a,b) {
  return a.rank - b.rank;  
} 

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  for( let i = 0; i < 44; i++ ) {
    for( let j = i+1; j < 45; j++ ) {
      for( let k = j+1; k < 46; k++ ) {
        remainingCombos.push({i,j,k});
      }
    }
  }
  const upCard = randomRemove(deck);
  noLoop();
}

function draw() {
  background('white')
  deck = shuffleDeck();
  let results = [];
  const deal = [randomRemove(deck),randomRemove(deck),randomRemove(deck),randomRemove(deck),randomRemove(deck),randomRemove(deck)];  
  for( let i = 0; i < deal.length-1; i++ ) {
    for( let j = i+1; j < deal.length; j++ ) {
      let hand = deal.filter( (card, index) => index !== i && index !== j )
      const crib = [deal[i], deal[j]];
      let scoreTotal = 0;
      let cribTotal = 0;
      let count = 0;
      for( let k = 0; k < deck.length; k++ ) {
        const upCard = deck[k];
        scoreTotal += scoreHand( hand, upCard );
      }
      for( let combo of remainingCombos ) {
        cribTotal += scoreHand( [...crib, deck[combo.j], deck[combo.k]], deck[combo.i])
      }
      average = scoreTotal / deck.length;
      cribAverage = cribTotal / remainingCombos.length;
      results.push({
        hand, 
        crib,
        average,
        cribAverage,
        netScore: average - cribAverage
      })
    }
  }
  results.sort( (a,b) => (b.average - b.cribAverage) - (a.average - a.cribAverage) );
  for( let i = 0; i < results.length; i++ ) {
    const {hand, crib, average, cribAverage, netScore} = results[i];
    const str = 'Hand: ' + cardsToString(hand) + ". Crib: " + cardsToString(crib) + ". Net Score: " + netScore + ". Average: " + average + ". Crib Average: " + cribAverage;
    text( str ,10, 15 + i*15);
  }
}

function keyPressed() {
  if( key === " " ) {
    redraw();
  }
}

function cardsToString( cards ) {
  return cards.map( c => c.str ).join(',')
}

function scoreHand( cards, upcard ) {
  const allCards = [...cards, upcard].sort(byRank);
  return fifteens( allCards )
          + runs( allCards ) 
          + flush( cards, upcard )
          + pairs( allCards )
          + knobs( cards, upcard )
}

function fifteens( cards ) {
  return 2 * 
    math.setPowerset( cards )
    .map( permutation => permutation.reduce( (sum, card) => sum + card.value, 0) )
    .filter( value => value === 15 )
    .length;
}

function counts( cards ) {
  return cards
          .map( card => card.rank )
          .reduce((counts,value) => {
            counts[value] ? counts[value]++ : counts[value] = 1;
            return counts
          },{})
}

function runs( cards ) {
  const handCounts = counts(cards);
  const uniqueRanks = Object.keys(handCounts).map( k => parseInt(k));
  const consecutiveCards = {total:1,start:uniqueRanks[0],end:uniqueRanks[0]};
  for( let i = 1; i < uniqueRanks.length; i++ ) {
    if( uniqueRanks[i] - uniqueRanks[i-1] === 1 ) {
      consecutiveCards.total++;
      consecutiveCards.end = uniqueRanks[i];
    } else if( consecutiveCards.total < 3 ) {
      consecutiveCards.total = 1;
      consecutiveCards.start = uniqueRanks[i];
      consecutiveCards.end = uniqueRanks[i];
    }
  }
  if( consecutiveCards.total >= 3 ) {
    let multiplier = 1;
    for( let i = consecutiveCards.start; i <= consecutiveCards.end; i++ ) {
      if( handCounts[i] == 2 ) {
        if( multiplier === 2 ) {
          multiplier = 4;
        } else {
          multiplier = 2;
        }
      }
      if( handCounts[i] === 3 ) {
        multiplier = 3;
      }
    }
    return consecutiveCards.total * multiplier;
  } else {
    return 0;
  }
}

function flush( hand, upcard ) {
  if( hand[0].suit === hand[1].suit &&
      hand[1].suit === hand[2].suit &&
      hand[2].suit === hand[3].suit ) {
    return hand[0].suit === upcard ? 5 : 4
  } else {
    return 0
  }
}

function pairs( cards ) {
  const points = {2:2,3:6,4:12};
  return Object.values( counts(cards) )
          .filter( value => value > 1 )
          .reduce( (total,current) => total + points[current],0)
  
}

function knobs( hand, upcard ) {
  return hand
    .filter( card => card.rank === 10 && card.suit === upcard.suit )
    .length
}