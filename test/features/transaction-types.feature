Feature: Transaction Types Management
    As an admin
    I want to manage transaction types
    So that users can categorize their transactions properly

    Scenario: Create a valid transaction type
        Given the request contains a valid transaction type name
        When the transaction type is created
        Then it appears in the types list
        And the system returns response 201 upon success

    Scenario: Prevent duplicate transaction type name
        Given a transaction type already exists with the same name
        When a request is made to create a type with the same name
        Then the system prevents the creation
        And the system returns 409

    Scenario: Transaction type creator not found
        Given the creator ID is invalid
        When the creation is attempted
        Then the system returns 404

    Scenario: Fetch existing transaction type
        Given a valid transaction type ID
        When the system searches for the type
        Then the details are displayed
        And the system returns response 200

    Scenario: Transaction type not found
        Given the provided ID does not exist
        When the system searches for the type
        Then the system returns 404

    Scenario: Unauthorized transaction type action
        Given the user is not the creator of the transaction type
        When an update or deletion is attempted
        Then the system returns 403

    Scenario: Restricted field update
        Given the user attempts to update restricted fields
        When the update is processed
        Then the system returns 403
