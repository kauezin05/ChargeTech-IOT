from flask import Flask, jsonify
import random
import time
import threading

app = Flask(__name__)

# Variáveis globais para armazenar os dados simulados
data = {}

# Função para simular a leitura de dados de energia
def get_energy_data():
    voltage = round(random.uniform(210.0, 240.0), 2)  # Voltagem entre 210V e 240V
    current = round(random.uniform(0.5, 5.0), 2)      # Corrente entre 0.5A e 5A
    power = voltage * current                          # Potência (W)
    total_energy = round(power * (1 / 3600.0), 4)      # Energia acumulada em Wh (com base em uma medição de 1 segundo)
    
    return {
        "voltage": voltage,
        "current": current,
        "power": power,
        "total_energy_wh": total_energy
    }

# Função para atualizar os dados a cada 10 segundos
def update_data():
    global data
    while True:
        data = get_energy_data()
        time.sleep(10)  # Atualiza os dados a cada 10 segundos

@app.route('/data', methods=['GET'])
def get_data():
    # Retorna os dados simulados (que mudam a cada 10 segundos)
    return jsonify(data)

if __name__ == '__main__':
    # Inicia a thread que atualiza os dados
    threading.Thread(target=update_data, daemon=True).start()
    # Inicializa o aplicativo Flask
    app.run(debug=True, host='0.0.0.0', port=5000)
