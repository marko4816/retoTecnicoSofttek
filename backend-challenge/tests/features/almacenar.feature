Feature: Almacenar datos personalizados en la base de datos
  Como usuario
  Quiero guardar información personalizada en la base de datos
  Para poder recuperarla más tarde

  Scenario: Almacenar un nuevo dato
    Given que envío una solicitud con datos personalizados
    When el servidor recibe la solicitud
    Then el sistema almacena la información en la base de datos
    And responde con un código 201 y un mensaje de éxito
