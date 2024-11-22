const express = require("express");
const oracledb = require("oracledb");
const app = express();
const port = 5000;

// Configuração do banco de dados Oracle
const dbConfig = {
  user: "rm551763",
  password: "fiap23",
  connectString: "oracle.fiap.com.br:1521/orcl",
};

// Variáveis globais para armazenar os dados simulados
let data = {
  voltage: 0,
  current: 0,
  power: 0,
  total_energy_wh: 0,
};

// Função para simular a leitura de dados de energia
function getEnergyData() {
  const voltage = parseFloat(
    (Math.random() * (240.0 - 210.0) + 210.0).toFixed(2),
  ); 
  const current = parseFloat((Math.random() * (5.0 - 0.5) + 0.5).toFixed(2)); 
  const power = parseFloat((voltage * current).toFixed(2)); 
  const totalEnergy = parseFloat((power * (1 / 3600.0)).toFixed(4)); 

  data = {
    voltage: voltage,
    current: current,
    power: power,
    total_energy_wh: totalEnergy,
  };
}

// Função para inserir dados no banco de dados Oracle
async function insertConsumoEnergetico(consumo, dataRegistro) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Seleciona todos os dispositivos
    const result = await connection.execute(
      "SELECT ID_DISPOSITIVO FROM CT_DISPOSITIVO",
    );
    const dispositivos = result.rows;

    for (const dispositivo of dispositivos) {
      const idDispositivo = dispositivo[0];

      const sql = `
        INSERT INTO CT_CONSUMO_ENERGETICO (
          ID_CONSUMO_ENERGETICO,
          ID_DISPOSITIVO,
          DATA_REGISTRO,
          CONSUMO
        )
        VALUES (
          CT_CONSUMO_ENERGETICO_SEQ.NEXTVAL,
          :id_dispositivo,
          TO_TIMESTAMP(:dataRegistro, 'DD/MM/YYYY HH24:MI:SS'),
          :consumo
        ) RETURNING ID_CONSUMO_ENERGETICO INTO :consumoEnergeticoId
      `;

      const bindParams = {
        id_dispositivo: idDispositivo,
        dataRegistro: dataRegistro,
        consumo: consumo,
        consumoEnergeticoId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      await connection.execute(sql, bindParams);
    }
    await connection.commit();

    console.log("Dados de consumo energético inseridos com sucesso!");
  } catch (err) {
    console.error("Erro ao inserir consumo energético:", err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Função para atualizar os dados e inserir no banco a cada 10 segundos
function updateData() {
  getEnergyData();
  const consumo = data.total_energy_wh;
  const dataRegistro = new Date().toLocaleString("pt-BR", {
    hour12: false,
    timeZone: "America/Sao_Paulo",
  });

  insertConsumoEnergetico(consumo, dataRegistro)
    .then(() => {
      console.log("Consumo energético inserido e atualizado.");
    })
    .catch((err) => {
      console.error("Erro ao inserir e atualizar consumo energético:", err);
    });

  // Aguardar 10 segundos e chamar a função novamente
  setTimeout(updateData, 10000); 
}

// Rota para retornar os dados simulados mais recentes
app.get("/data", (req, res) => {
  console.log("Dados mais recentes:", data);
  res.json(data);
});

// Inicializa o servidor Express
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    
    updateData();
  });
  