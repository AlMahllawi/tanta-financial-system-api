Feature: Pagination Testing
    As a client consuming the API
    I want to be able to request paginated lists
    So that I can efficiently fetch data

    Scenario: Department Pagination with default limits
        Given the user is authenticated
        And there are 15 seeded departments
        When the user requests departments with default pagination
        Then the system returns response 200
        And the paginated department data contains up to 10 items
        And the department pagination metadata shows page 1 and perPage 10

    Scenario: Department Pagination with specific limits
        Given the user is authenticated
        And there are 15 seeded departments
        When the user requests departments page 2 with limit 5
        Then the system returns response 200
        And the paginated department data contains 5 items
        And the department pagination metadata shows page 2 and perPage 5

    Scenario: User Pagination
        Given the user is authenticated
        And there are 15 seeded users
        When the user requests users page 1 with limit 5
        Then the system returns response 200
        And the paginated user data contains 5 items
        And the user pagination total count is at least 15

    Scenario: Transaction Type Pagination
        Given the user is authenticated
        And there are 15 seeded transaction types
        When the user requests transaction types page 1 with limit 5
        Then the system returns response 200
        And the paginated transaction types data contains 5 items
        And the transaction types pagination metadata shows perPage 5

    Scenario: Transaction Forward Pagination
        Given the user is authenticated
        And there is a transaction with 15 forwards
        When the user requests transaction forwards page 1 with limit 5
        Then the system returns response 200
        And the paginated forwards data contains 5 items
        And the forwards pagination total count is at least 15
        And the forwards pagination metadata shows perPage 5

    Scenario: Transaction Pagination
        Given the user is authenticated
        And there are 15 seeded transactions
        When the user requests transactions query "all" page 1 with limit 5
        Then the system returns response 200
        And the paginated transactions data contains 5 items
        And the transactions total count is at least 15
        And the transactions pagination metadata shows perPage 5
