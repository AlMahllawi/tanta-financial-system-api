Feature: Authentication Management
  As a registered admin
  I want to log into the system
  So that I can access my personal dashboard

  Scenario: Successful Login
    Given the user inputs username and password
    When the data is correct
    Then the user should be logged in successfully
    And the system returns response 200

  Scenario: Invalid credentials
    When the user inputs incorrect data
    Then the system should reject it
    And the system returns 401

  Scenario: Formatting errors
    When there are errors in writing username or password
    Then the system should clarify the errors
    And the system returns 400

  Scenario: Using an invalid refresh token
    When the user provides an invalid refresh token
    Then the system should reject it
    And the system returns 401
