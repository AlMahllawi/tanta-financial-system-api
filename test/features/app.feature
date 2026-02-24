Feature: App Metadata and Health
    As an API consumer
    I want to check the root endpoint
    So that I can verify the API is running and get its metadata

    Scenario: Fetch API Metadata and Health
        Given the API is running
        When I request the root endpoint
        Then the system returns the metadata containing name, version, and description
        And the system returns the health status as up
        And the system returns response 200
