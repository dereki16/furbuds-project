//Added code snippet that extracted information from api. The random dog api can be changed to another api.  
fetchSpecies();
var url = "https://dog.ceo/api/breeds/image/random"
async function fetchSpecies(){ 
const url = `https://dog.ceo/api/breeds/image/random`;
       
let response = await fetch(url);
let data = await response.json();
Object.keys(data).forEach((key) => {
  var element = document.createElement("span");
  var img = document.createElement("img");
  img.setAttribute("src", data[key]);
  element.appendChild(img);
  var elem = document.getElementById('Dog').appendChild(element);
  });
}

fetchCatFacts();
var url = "https://cat-fact.herokuapp.com/facts"

async function fetchCatFacts(){       
  const url = `https://cat-fact.herokuapp.com/facts`;       
  let response = await fetch(url);
  let data = await response.json();   
  var Fact = [];
  data.all.forEach(function(cats){       
    Fact.push(cats.text); 
  });
  //console.log(Fact[2]);
  let Random = Math.floor((Math.random() * 20) + 1); 
  document.querySelector("#catFacts").innerHTML = "Fun Fact: " +  Fact[Random];
}

$(function(){
    $('.close').click(function(){      
        $('iframe').attr('src', $('iframe').attr('src'));
    });
});





