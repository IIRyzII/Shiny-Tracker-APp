document.addEventListener('DOMContentLoaded', function() {
    const searchBar = document.getElementById('searchBar');
    const pokedex = document.getElementById('pokedex');
    let pokemonList = []; // To hold the full list of Pokémon for search filtering

    searchBar.addEventListener('keyup', (e) => {
        const searchString = e.target.value.toLowerCase();
        const filteredPokemon = pokemonList.filter(pokemon => {
            return (
                pokemon.name.toLowerCase().includes(searchString) ||
                pokemon.types.toLowerCase().includes(searchString) ||
                pokemon.gen.toLowerCase().includes(searchString) ||
                pokemon.id.toString().startsWith(searchString) // For searching by Pokédex number
            );
        });
        displayPokemons(filteredPokemon);
    });

    fetch('https://pokeapi.co/api/v2/pokemon?limit=1051')
    .then(response => response.json())
    .then(data => {
        const promises = data.results.map(pokemon => fetch(pokemon.url).then(res => res.json()));
        Promise.all(promises).then(results => {
            pokemonList = results.map(result => ({
                id: result.id,
                name: formatPokemonName(result.name),
                types: result.types.map(type => type.type.name).join(', '),
                gen: determineGeneration(result),
                sprite: result.sprites.other['official-artwork'].front_shiny
            }));
            displayPokemons(pokemonList);
            const initialShinyPokemon = JSON.parse(localStorage.getItem('shinyPokemon') || '[]');
            updateShinyProgress(initialShinyPokemon);
            // Once everything is loaded, hide the loading indicator
            const loadingIndicator = document.getElementById('loadingIndicator');
            loadingIndicator.style.opacity = '0';
            setTimeout(() => { loadingIndicator.style.display = 'none'; }, 500); // Match the duration of the CSS transition

        });
    });


    
    document.getElementById('deselectAllBtn').addEventListener('click', function() {
        // Clear shiny selection
        let shinyPokemon = []; // Reset the shiny Pokemon list
        localStorage.setItem('shinyPokemon', JSON.stringify(shinyPokemon));
        
        // Update the UI to reflect the deselection
        const allPokemonContainers = document.querySelectorAll('.pokemon');
        allPokemonContainers.forEach(pokeContainer => {
            pokeContainer.classList.remove('shiny-selected');
            const img = pokeContainer.querySelector('img');
            if (img) img.classList.add('not-shiny'); // Revert to non-shiny appearance
        });
    
        // Update progress bar and count
        updateShinyProgress(shinyPokemon);
    });
    




    function displayRecentShinies(recentShinies) {
        const recentShiniesContainer = document.getElementById('recentShinies');
        recentShiniesContainer.innerHTML = ''; // Clear previous entries
        
        recentShinies.forEach(shiny => {
            // Construct the URL for the specific Pokémon's data
            const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${shiny.id}`;
            
            // Fetch the Pokémon data from the API
            fetch(pokemonUrl)
                .then(response => response.json())
                .then(pokemonData => {
                    // Create a div to display the shiny sprite
                    const shinyDiv = document.createElement('div');
                    shinyDiv.classList.add('recent-shiny');
                    
                    // Set the innerHTML of the div to include the shiny sprite image
                    shinyDiv.innerHTML = `
                        <img src="${pokemonData.sprites.front_shiny}" alt="${pokemonData.name}" title="${pokemonData.name}">
                    `;
                    
                    // Append the div to the recentShiniesContainer
                    recentShiniesContainer.appendChild(shinyDiv);
                })
                .catch(error => console.error('Error fetching Pokémon data:', error));
        });
    }
    



    function updateShinyStatus(pokemonId, isShiny) {
        let shinyPokemon = JSON.parse(localStorage.getItem('shinyPokemon') || '[]');
        
        if (isShiny && !shinyPokemon.some(sp => sp.id === pokemonId)) {
            shinyPokemon.push({ id: pokemonId, timestamp: new Date().getTime() }); // Add timestamp
        } else if (!isShiny) {
            shinyPokemon = shinyPokemon.filter(sp => sp.id !== pokemonId);
        }
        
        // Keep only the latest 3 shinies for display, based on timestamp
        shinyPokemon.sort((a, b) => b.timestamp - a.timestamp);
        
        localStorage.setItem('shinyPokemon', JSON.stringify(shinyPokemon));
        updateShinyProgress(shinyPokemon); // Update progress bar whenever shiny status changes
        displayRecentShinies(shinyPokemon.slice(0, 3)); // Display the 3 most recent shinies
    }
    

    function updateShinyProgress(shinyPokemon) {
        const totalPokemon = pokemonList.length; // Make sure this reflects the total count correctly
        const shinyCount = shinyPokemon.length; // Number of shiny Pokémon
    
        const shinyProgress = document.getElementById('shinyProgress');
        const shinyCountDisplay = document.getElementById('shinyCount');
    
        shinyProgress.value = shinyCount;
        shinyProgress.max = totalPokemon; // Ensure the max value is updated based on the total Pokémon count
        shinyCountDisplay.textContent = `${shinyCount} / ${totalPokemon}`;
    }
    

    // Call updateShinyProgress initially in case there are already stored shiny Pokémon
    const initialShinyPokemon = JSON.parse(localStorage.getItem('shinyPokemon') || '[]');
    updateShinyProgress(initialShinyPokemon);

    

    function displayPokemons(pokemons) {
        pokedex.innerHTML = '';
        let shinyPokemon = JSON.parse(localStorage.getItem('shinyPokemon') || '[]');
    
        pokemons.forEach(pokemon => {
            const pokeContainer = document.createElement('div');
            pokeContainer.classList.add('pokemon');
            pokeContainer.id = `pokemon-${pokemon.id}`;
    
            const isShiny = shinyPokemon.some(sp => sp.id === pokemon.id);
    
            pokeContainer.innerHTML = `
                <img src="${pokemon.sprite}" alt="${pokemon.name}" class="${isShiny ? '' : 'not-shiny'}">
                <p>#${pokemon.id} ${pokemon.name}</p>
                <div class="pokemon-info">Type: ${pokemon.types} | Base Game: ${pokemon.gen}</div>
            `;
    
            if (isShiny) {
                pokeContainer.classList.add('shiny-selected');
            }
    
            pokeContainer.addEventListener('click', () => {
                const img = pokeContainer.querySelector('img');
                img.classList.toggle('not-shiny');
                pokeContainer.classList.toggle('shiny-selected'); 
                updateShinyStatus(pokemon.id, pokeContainer.classList.contains('shiny-selected'));
            });
    
            pokedex.appendChild(pokeContainer);
        });
    }
    
    

    function formatPokemonName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    }

    function determineGeneration(pokemon) {
        // Example logic to determine generation
        // You'll need to adjust this based on the Pokémon's data
        const version = pokemon.game_indices[0]?.version.name || 'unknown';
        return ` ${version}`; // Placeholder, adjust as needed
    }
});

document.getElementById('toggleMenuButton').addEventListener('click', function() {
    const menuContainer = document.getElementById('menuContainer');
    if (menuContainer.classList.contains('hidden')) {
        menuContainer.classList.remove('hidden');
        menuContainer.style.maxHeight = menuContainer.scrollHeight + "px";
        this.textContent = "Hide Menu"; // Change button text
    } else {
        menuContainer.classList.add('hidden');
        menuContainer.style.maxHeight = null;
        this.textContent = "Show Menu"; // Change button text back
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch(error => {
      console.log('Service Worker registration failed:', error);
    });
  }
  