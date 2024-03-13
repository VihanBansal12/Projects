import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function PokemonCard({ pokemon }) {
  const cardStyle = {
    backgroundColor: getColorByType(pokemon.types[0]), // Using the first type for simplicity
  };

  function getColorByType(type) {
    const typeColors = {
      fire: '#FFA07A',
      grass: '#90EE90',
      water: '#ADD8E6',
      bug: '#9ACD32',
      ghost: '#705898', // Ghost type color
      electric: '#FFD700',
      // Add more types and their colors as needed
    };

    return typeColors[type] || '#FFC0CB'; // Default color for unknown types
  }

  return (
    <div className="pokemon-card" style={cardStyle}>
      <div className="pokemon-card-inner">
        <div className="pokemon-card-front">
          <img
            src={`https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/${pokemon.id}.svg`}
            alt={pokemon.name}
          />
        </div>
        <div className="pokemon-card-back">
          <div className="pokemon-info">
            <p>Name: {pokemon.name}</p>
            <p>Type(s): {pokemon.types.join(', ')}</p>
            <p>ID: {pokemon.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [selectedType, setSelectedType] = useState('');

  const observer = useRef();
  const lastPokemonRef = useRef();

  useEffect(() => {
    setLoading(true);
    fetchPokemonData('https://pokeapi.co/api/v2/pokemon?limit=2000');
  }, []);

  useEffect(() => {
    if (loading) return;

    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        fetchMorePokemon();
      }
    }, options);

    if (lastPokemonRef.current) {
      observer.current.observe(lastPokemonRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading]);

  const fetchPokemonData = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      const updatedPokemonList = await Promise.all(
        data.results.map(async (pokemon) => {
          const response = await fetch(pokemon.url);
          if (!response.ok) {
            throw new Error('Failed to fetch pokemon data');
          }
          const pokemonData = await response.json();
          return {
            id: pokemonData.id,
            name: pokemonData.name,
            types: pokemonData.types.map((type) => type.type.name),
          };
        })
      );
      setPokemonList((prevList) => [...prevList, ...updatedPokemonList]);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchMorePokemon = () => {
    fetchPokemonData(`https://pokeapi.co/api/v2/pokemon?limit=2000&offset=${pokemonList.length}`);
  };

  const fetchPokemonById = async () => {
    if (searchId.trim() !== '') {
      setLoading(true);
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchId.toLowerCase()}`);
        if (!response.ok) {
          throw new Error('Pokemon not found!');
        }
        const pokemonData = await response.json();
        const foundPokemon = {
          id: pokemonData.id,
          name: pokemonData.name,
          types: pokemonData.types.map((type) => type.type.name),
        };
        setFilteredPokemon([foundPokemon]);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setFilteredPokemon([]);
        setLoading(false);
      }
    } else {
      setFilteredPokemon([]);
    }
  };

  const handleSearchById = () => {
    fetchPokemonById();
  };

  // ... (previous code remains unchanged)

const handleFilterChange = (e) => {
  const selectedType = e.target.value;
  setSelectedType(selectedType);

  if (selectedType !== '') {
    const filtered = pokemonList.filter((pokemon) =>
      pokemon.types.includes(selectedType)
    );
    setFilteredPokemon(filtered);
  } else {
    setFilteredPokemon([]);
  }
};

// ... (rest of the code remains unchanged)


  return (
    <div className="App">
      <h1 className='heading'>Pokédex</h1>
      <div className="search">
        <input
          type="text"
          placeholder="Search by ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={handleSearchById}>Search by ID</button>
        <select value={selectedType} onChange={handleFilterChange}>
          <option value="">Filter by Type</option>
          {Array.from(
            new Set(pokemonList.flatMap((pokemon) => pokemon.types))
          ).map((type, index) => (
            <option key={index} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="pokemon-list">
        {(filteredPokemon.length > 0 ? filteredPokemon : pokemonList).map((pokemon, index) => {
          if ((filteredPokemon.length > 0 ? filteredPokemon : pokemonList).length === index + 1) {
            return (
              <div className="pokemon-card-container" key={pokemon.id} ref={lastPokemonRef}>
                <PokemonCard pokemon={pokemon} />
              </div>
            );
          } else {
            return (
              <div className="pokemon-card-container" key={pokemon.id}>
                <PokemonCard pokemon={pokemon} />
              </div>
            );
          }
        })}
        {loading && <p>Loading...</p>}
      </div>
    </div>
  );
}

export default App;

