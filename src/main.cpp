#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/adc.h"
#include "esp_adc_cal.h"

#define ADC_CHANNEL ADC1_CHANNEL_0  // Canal 0 do ADC1
#define ADC_WIDTH   ADC_WIDTH_BIT_12 // Resolução de 12 bits
#define ADC_ATTEN   ADC_ATTEN_DB_11 // Atenuação do ADC (0-3.3V)
#define MEASUREMENT_INTERVAL_MS 1000 // Intervalo entre medições (ms)

// Valores de calibração
#define VOLTAGE_DIVIDER_RATIO 10.0   // Divisor de tensão
#define CURRENT_SENSOR_FACTOR 0.066  // Sensor de corrente (66mV/A)

void init_adc() {
    adc1_config_width(ADC_WIDTH);
    adc1_config_channel_atten(ADC_CHANNEL, ADC_ATTEN);
}

uint32_t read_adc_raw() {
    return adc1_get_raw(ADC_CHANNEL);
}

float read_voltage() {
    uint32_t raw_adc = read_adc_raw();
    return ((float) raw_adc / 4095) * 3.3 * VOLTAGE_DIVIDER_RATIO;
}

float read_current() {
    uint32_t raw_adc = read_adc_raw();
    float voltage_drop = ((float) raw_adc / 4095) * 3.3;
    return voltage_drop / CURRENT_SENSOR_FACTOR;
}

void setup() {
    Serial.begin(115200); // Inicializa o terminal serial
    init_adc();
    Serial.println("Sistema de Monitoramento de Energia Inicializado");
}

void loop() {
    static float total_energy_wh = 0;

    float voltage = read_voltage();
    float current = read_current();
    float power = voltage * current;

    // Calcular energia consumida
    total_energy_wh += power * (MEASUREMENT_INTERVAL_MS / 3600000.0);

    // Exibir dados no terminal
    Serial.printf("Tensão: %.2f V, Corrente: %.2f A, Potência: %.2f W, Energia acumulada: %.2f Wh\n",
                  voltage, current, power, total_energy_wh);

    delay(MEASUREMENT_INTERVAL_MS); // Intervalo entre medições
}
