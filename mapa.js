// Coordenadas iniciais
const initialCoordinates = [-23.55052, -46.633308];
const initialZoom = 4;

// Inicializa o mapa Leaflet
const map = L.map('map', {
  zoomControl: false
}).setView(initialCoordinates, initialZoom);

// Variável global para controlar o grupo de marcadores atual
let grupoAtual = null;

// Variável global para armazenar os dados carregados do JSON
let pontos = []; // Inicialmente vazia

// Configurações adicionais para o mapa
map.options.minZoom = 3; // Define o zoom mínimo
map.options.maxZoom = 18; // Define o zoom máximo

// Define limites rígidos para o mapa
const southWest = L.latLng(-90, -180);
const northEast = L.latLng(90, 180);
const bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);

// Ativa a viscosidade para impedir que o mapa seja arrastado para fora
map.options.maxBoundsViscosity = 1.0;

// Impede que o mapa se repita horizontalmente
map.options.worldCopyJump = false;

// Camada base do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variável para armazenar a linha de distância
let linhaDistancia = null;

// Função para adicionar marcadores a partir de um array de objetos
function adicionarMarcadores(pontos) {
  console.log('Adicionando marcadores para os seguintes pontos:', pontos); // Log para verificar os dados recebidos

  const markerCluster = L.markerClusterGroup(); // cria um novo grupo de cluster

  pontos.forEach(ponto => {
    const lat = parseFloat(ponto.latitude);
    const lng = parseFloat(ponto.longitude);
    console.log(`Processando ponto: Latitude ${lat}, Longitude ${lng}`); // Log para cada ponto

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Ponto ignorado devido a coordenadas inválidas:', ponto);
      return;
    }

    const numero = ponto['Número']; // Corrige o acesso à propriedade com acento
    const { 
      Cnpj, 
      Logradouro, 
      Cep, 
      Município: municipio, 
      'Alvará de Funcionameto': alvara, 
      'Vigilância Sanitária': vigilancia, 
      'Corpo de Bombeiros': bombeiros, 
      'Telefone de contato': telefone, 
      'Correio eletronico': email, 
      'Nome fantasia': nomeFantasia,
      'Ramo de atividade': ramoDeAtividade,
      Ramo // <- adicionamos aqui o outro campo do JSON
    } = ponto;

      // Usa o valor de "Ramo" se existir, senão o "Ramo de atividade"
      //const ramoAtividade = Ramo || ramoDeAtividade || 'Não informado';


    // Função para formatar status (melhorada)
    const formatarStatus = (status) => {
      if (status === '1' || status === 1) {
        return '<span style="color: green; font-weight: bold;">Aprovado</span>';
      } 
      else if (status === '0' || status === 0) {
        return '<span style="color: red; font-weight: bold;">Reprovado</span>';
      } 
      else if (typeof status === 'string' && status.toLowerCase().includes('não precisa')) {
        return '<span style="color: orange; font-weight: bold;">Não precisa de alvará</span>';
      } 
      else {
        return '<span style="color: gray;">Não informado</span>';
      }
    };


    const nomeFantasiaExibido = nomeFantasia ? nomeFantasia : 'Não informado';

    const popupContent = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <strong>Nome Fantasia:</strong> ${nomeFantasiaExibido}<br>
        <strong>CNPJ:</strong> ${Cnpj}<br>
        <strong>Endereço:</strong> ${Logradouro}, ${numero}<br>
        <strong>Município:</strong> ${municipio}<br>
        <strong>CEP:</strong> ${Cep}<br>
        <strong>Ramo de Atividade:</strong> ${ramoDeAtividade}<br>
        <strong>Alvará de Funcionamento:</strong> ${formatarStatus(alvara)}<br>
        <strong>Vigilância Sanitária:</strong> ${formatarStatus(vigilancia)}<br>
        <strong>Corpo de Bombeiros:</strong> ${formatarStatus(bombeiros)}<br>
        <strong>Validade de Bombeiros:</strong> ${ponto['Validade de Bombeiros'] || 'Não informado'}<br>
        <strong>Telefone:</strong> ${telefone}<br>
        <strong>Email:</strong> <a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a>
      </div>
    `;

    const marker = L.marker([lat, lng]).bindPopup(popupContent, {
      className: 'custom-popup',
      autoClose: true, // Fecha automaticamente outros popups
      closeOnClick: true // Fecha ao clicar fora
    });

    marker.on('popupopen', () => {
      const popupElement = document.querySelector('.custom-popup');
      if (popupElement) {
        popupElement.style.animation = 'fadeIn 0.5s ease';
      }
    });

    // Adicionar evento de clique para calcular e exibir a distância
    marker.on('click', () => {
      if (linhaDistancia) {
        map.removeLayer(linhaDistancia); // Remove a linha anterior, se existir
      }

      const distancia = calcularDistancia(circuloLocalizacao.getLatLng().lat, circuloLocalizacao.getLatLng().lng, lat, lng);
      const pontoInicial = [circuloLocalizacao.getLatLng().lat, circuloLocalizacao.getLatLng().lng];
      const pontoFinal = [lat, lng];

      // Traçar a linha entre os dois pontos
      linhaDistancia = L.polyline([pontoInicial, pontoFinal], {
        color: 'red',
        weight: 2
      }).addTo(map);

      // Calcular o ponto médio da linha
      const pontoMedio = [
        (pontoInicial[0] + pontoFinal[0]) / 2,
        (pontoInicial[1] + pontoFinal[1]) / 2
      ];

      // Adicionar um marcador com o texto da distância no ponto médio
      const marcadorDistancia = L.divIcon({
        className: 'distancia-label',
        html: `<div style="color: blue; font-weight: bold; font-size: 14px; white-space: nowrap; transform: translate(-50%, -50%);">${distancia.toFixed(2)} km</div>`
      });

      const marcadorTexto = L.marker(pontoMedio, { icon: marcadorDistancia }).addTo(map);

      // Remover o marcador de distância ao remover a linha
      linhaDistancia.on('remove', () => {
        map.removeLayer(marcadorTexto);
      });

      alert(`Distância até este local: ${distancia.toFixed(2)} km`);
    });

    markerCluster.addLayer(marker);
  });

  // Remove o cluster anterior, se existir
  if (grupoAtual) {
    map.removeLayer(grupoAtual);
  }

  map.addLayer(markerCluster);

  if (markerCluster.getLayers().length > 0) {
    map.fitBounds(markerCluster.getBounds(), { padding: [50, 50] });
  }

  grupoAtual = markerCluster; // Atualiza o grupo atual

  return markerCluster; // Retorna o cluster criado
}

// Função para pesquisar no mapa por CNPJ, CEP ou endereço
function pesquisarMapa(query, dados) {
  const resultado = dados.find(ponto => {
    return (
      ponto.Cnpj === query ||
      ponto.Cep === query ||
      ponto.Logradouro.toLowerCase().includes(query.toLowerCase())
    );
  });

  if (resultado) {
    const { latitude, longitude, Logradouro, Numero, Cep, ['Município']: municipio } = resultado;
    map.setView([latitude, longitude], 15); // Centraliza o mapa no local encontrado

    // Exibe um popup com as informações do local
    const popupContent = `
      <strong>Endereço:</strong> ${Logradouro}, ${Numero}<br>
      <strong>Município:</strong> ${municipio}<br>
      <strong>CEP:</strong> ${Cep}<br>
      <strong>CNPJ:</strong> ${resultado.Cnpj}
    `;
    const popup = L.popup()
      .setLatLng([latitude, longitude])
      .setContent(popupContent)
      .openOn(map);
  } else {
    alert('Nenhum resultado encontrado para a pesquisa.');
  }
}

// Carrega o arquivo JSON local
fetch('../data/empresas.json') // ajuste o caminho conforme necessário
  .then(response => {
    if (!response.ok) throw new Error('Erro ao carregar o JSON');
    return response.json();
  })
  .then(data => {
    console.log('Dados carregados:', data); // debug
    pontos = data; // Armazena os dados na variável global
    adicionarMarcadores(pontos); // Adiciona os marcadores ao mapa
  })
  .catch(error => {
    console.error('Erro ao processar os dados:', error);
  });

// Adiciona funcionalidade ao botão search-bar
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');



// Realiza a pesquisa ao pressionar Enter
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const query = searchInput.value;
    if (query) {
      fetch('../data/empresas.json')
        .then(response => response.json())
        .then(data => pesquisarMapa(query, data)) // Corrige a sintaxe do then
        .catch(error => console.error('Erro ao carregar os dados:', error));
    } else {
      alert('Digite um termo para pesquisar.');
    }
  }
});

// Alternar entre botão de filtro e barra de filtro e categoria
const filterToggle = document.getElementById('filterToggle');
const filterBar = document.getElementById('filterBar');
const categoryToggle = document.getElementById('categoryToggle');
const categoryBar = document.getElementById('categoryBar');

// Alterna visibilidade do filtro — sem duplicar
filterToggle.addEventListener('click', () => {
  if (filterBar.classList.contains('show')) {
    // Se já estiver aberto, fecha
    filterBar.classList.remove('show');
  } else {
    // Fecha qualquer outra barra aberta antes de abrir esta
    categoryBar.classList.remove('show');
    filterBar.classList.add('show');
  }
});

// Alterna visibilidade da categoria — sem duplicar
categoryToggle.addEventListener('click', () => {
  if (categoryBar.classList.contains('show')) {
    categoryBar.classList.remove('show');
  } else {
    filterBar.classList.remove('show');
    categoryBar.classList.add('show');
  }
});


// Preencher o filtro de municípios dinamicamente
fetch('../data/empresas.json')
  .then(response => response.json())
  .then(data => {
    const municipioFilter = document.getElementById('municipioFilter');
    const municipios = [...new Set(data.map(ponto => ponto['Município']))].sort();

    // Adiciona a opção "Todos" no início
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Todos';
    municipioFilter.appendChild(allOption);

    // Adiciona as demais opções
    municipios.forEach(municipio => {
      const option = document.createElement('option');
      option.value = municipio;
      option.textContent = municipio;
      municipioFilter.appendChild(option);
    });
  })
  .catch(error => console.error('Erro ao carregar os dados para o filtro de municípios:', error));

// Mapeamento de municípios para seus respectivos códigos IBGE
const codigosIBGE = {
  "SAO PAULO": 3550308,
  "SAO BERNARDO DO CAMPO": 3548708,
  "SAO CAETANO DO SUL": 3548807,
  "SANTO ANDRE": 3547809,
  "OSASCO": 3534401,
  "GUARULHOS": 3518800,
  "DIADEMA": 3513801,
};
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Adicionar evento para filtrar os marcadores e exibir as malhas
const municipioFilter = document.getElementById('municipioFilter');
municipioFilter.addEventListener('change', () => {
  const selectedMunicipio = municipioFilter.value;
  console.log(`Município selecionado: ${selectedMunicipio}`);

  fetch('../data/empresas.json')
    .then(response => {
      if (!response.ok) throw new Error('Erro ao carregar o JSON');
      return response.json();
    })
    .then(data => {
      const filteredData = selectedMunicipio
        ? data.filter(ponto => ponto['Município'] === selectedMunicipio)
        : data;

      console.log('Dados filtrados:', filteredData);

      // Limpar marcadores existentes no mapa
      if (grupoAtual) {
        map.removeLayer(grupoAtual);
      }

      // Adicionar marcadores filtrados
      adicionarMarcadores(filteredData);

      // Buscar o código do município para exibir os limites
      if (selectedMunicipio) {
        const codigoIBGE = codigosIBGE[normalizarTexto(selectedMunicipio)];
        console.log(`Código IBGE para o município ${selectedMunicipio}: ${codigoIBGE}`);

        if (codigoIBGE) {
          exibirLimitesMunicipio(codigoIBGE);
        } else {
          console.warn(`Código IBGE não encontrado para o município: ${selectedMunicipio}`);
        }
      } else {
        // Limpar camadas anteriores de limites
        map.eachLayer(layer => {
          if (layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
          }
        });
        console.log('Nenhum município selecionado, malhas removidas.');
      }
    })
    .catch(error => console.error('Erro ao filtrar os dados:', error));
});

// Adiciona logs para depuração
function exibirLimitesMunicipio(codigoMunicipio) {
  console.log(`Buscando limites para o município com código IBGE: ${codigoMunicipio}`);
  const url = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigoMunicipio}?formato=application/vnd.geo+json`;

  fetch(url)
    .then(response => {
      console.log(`Resposta da API para o código ${codigoMunicipio}:`, response);
      if (!response.ok) {
        throw new Error('Erro ao buscar os dados do município');
      }
      return response.json();
    })
    .then(data => {
      console.log(`Dados GeoJSON recebidos para o código ${codigoMunicipio}:`, data);
      const geojson = L.geoJSON(data, {
        style: {
          color: 'blue',
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.2
        }
      });

      // Limpar camadas anteriores de limites
      map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) {
          map.removeLayer(layer);
        }
      });

      geojson.addTo(map);
      map.fitBounds(geojson.getBounds());
    })
    .catch(error => {
      console.error('Erro ao carregar os limites do município:', error);
    });
}
function carregarCategorias() {
  fetch('../data/empresas.json')
    .then(response => response.json())
    .then(data => {
      const categorias = new Set(data.map(empresa => empresa.Ramo));
      const categoryFilter = document.getElementById('categoryFilter');

      // Adiciona a opção "Todas" no início
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'Todos';
      categoryFilter.appendChild(allOption);

      // Adiciona as categorias
      categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoryFilter.appendChild(option);
      });
    })
    .catch(error => console.error('Erro ao carregar categorias:', error));
}

// Função para aplicar filtros combinados de município e categoria
function aplicarFiltros() {
  const categoriaSelecionada = document.getElementById('categoryFilter').value;
  const municipioSelecionado = document.getElementById('municipioFilter').value;

  fetch('../data/empresas.json')
    .then(response => response.json())
    .then(data => {
      const empresasFiltradas = data.filter(empresa => {
        const filtroCategoria = categoriaSelecionada === '' || empresa.Ramo === categoriaSelecionada;
        const filtroMunicipio = municipioSelecionado === '' || empresa['Município'] === municipioSelecionado;
        return filtroCategoria && filtroMunicipio;
      });

      console.log('Empresas filtradas:', empresasFiltradas);

      // Limpar marcadores existentes no mapa
      if (grupoAtual) {
        map.removeLayer(grupoAtual);
      }

      // Adicionar marcadores filtrados ao mapa
      if (empresasFiltradas.length > 0) {
        adicionarMarcadores(empresasFiltradas);
      } else {
        console.log('Nenhum local corresponde aos filtros aplicados.');
      }
    })
    .catch(error => console.error('Erro ao aplicar filtros:', error));
}

// Atualizar eventos para aplicar filtros ao mudar município ou categoria
document.getElementById('categoryFilter').addEventListener('change', aplicarFiltros);
document.getElementById('municipioFilter').addEventListener('change', aplicarFiltros);

// Carregar categorias ao iniciar
document.addEventListener('DOMContentLoaded', carregarCategorias);

// Função para calcular a distância entre dois pontos (fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Retorna a distância em km
}

// Função para filtrar os pontos dentro de um raio
function filtrarPorRaio(pontos, latitudeUsuario, longitudeUsuario, raio) {
  return pontos.filter((ponto) => {
    const distancia = calcularDistancia(
      latitudeUsuario,
      longitudeUsuario,
      ponto.latitude,
      ponto.longitude
    );
    return distancia <= raio; // Retorna apenas os pontos dentro do raio
  });
}

let circuloLocalizacao = null; // Variável para armazenar o círculo de localização
let marcadorLocalizacao = null; // Variável para armazenar o marcador de localização

// Evento para o botão de localização
document.getElementById('filtrarLocalizacao').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert("Geolocalização não é suportada pelo seu navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      if (circuloLocalizacao || marcadorLocalizacao) {
        // Remove o círculo e o marcador se já existirem
        if (circuloLocalizacao) {
          map.removeLayer(circuloLocalizacao);
          circuloLocalizacao = null;
        }
        if (marcadorLocalizacao) {
          map.removeLayer(marcadorLocalizacao);
          marcadorLocalizacao = null;
        }
        return; // Sai da função para evitar recriação
      }

      const raio = 5; // Raio em km

      // Adiciona um círculo ao redor da localização do usuário
      circuloLocalizacao = L.circle([latitude, longitude], {
        color: 'blue',
        fillColor: '#add8e6',
        fillOpacity: 0.3,
        radius: raio * 1000, // Converte km para metros
      }).addTo(map);

      // Adiciona um marcador azul na localização do usuário
      marcadorLocalizacao = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'custom-location-icon',
          html: '<div style="width: 12px; height: 12px; background: blue; border-radius: 50%;"></div>',
          iconSize: [12, 12],
        }),
      }).addTo(map);

      // Centraliza e dá zoom na localização do usuário
      map.setView([latitude, longitude], 15); // Zoom nível 15

      // Filtra os pontos e adiciona os marcadores
      const pontosFiltrados = filtrarPorRaio(pontos, latitude, longitude, raio);
      adicionarMarcadores(pontosFiltrados);

      // Mensagem de confirmação
      alert(`Exibindo empresas dentro de ${raio} km da sua localização.`);
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("Você precisa permitir o acesso à sua localização para usar este recurso.");
      } else {
        alert("Não foi possível obter sua localização. Tente novamente.");
      }
    }
  );
});