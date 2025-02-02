Feature: Obtener datos fusionados de Star Wars y clima
  Como usuario
  Quiero obtener una lista de personajes de Star Wars con información del clima de su planeta
  Para saber en qué condiciones viven

  Scenario: Obtener datos cuando no están en caché
    Given que la caché está vacía
    When solicito la información fusionada
    Then el sistema consulta las APIs externas
    And devuelve una lista de personajes con datos del clima

  Scenario: Obtener datos cuando están en caché
    Given que los datos ya están en caché
    When solicito la información fusionada
    Then el sistema devuelve los datos desde la caché
