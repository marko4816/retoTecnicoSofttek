Feature: Obtener el historial de datos almacenados
  Como usuario
  Quiero ver el historial de datos guardados
  Para revisar registros previos

  Scenario: Obtener historial exitosamente
    Given que existen registros en la base de datos
    When solicito el historial
    Then el sistema devuelve una lista de registros
