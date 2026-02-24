Feature: Users Management
  As an admin
  I want to manage system users and roles
  So that I can control access and view user details

  Scenario: Successful user creation
    Given the request provides username, password, and role
    And the password should be encrypted
    When the user is created successfully
    Then the system returns response 201

  Scenario: Duplicate user creation
    Given the user already exists
    When the admin tries to create the user
    Then the system returns 409

  Scenario: Missing department on user creation
    Given no department is selected
    When the admin tries to create the user
    Then the system returns 404

  Scenario: Unauthorized role accessing restricted resource
    Given the user is logged in with role USER
    When they try to access an endpoint that requires role ADMIN
    Then the system respond with 403 Forbidden
  
   Scenario: One or more of the fields are empty or contain an error
    Given Explain where the error is
    When the admin tries to create the user
    Then the system returns 400 
    
  Scenario: View populated users list
    Given the endpoint is protected
    When the user requests the list of all users
    Then the full list of users is displayed
    And the endpoint filters users based on hierarchical order
    And the system returns response 200

  Scenario: View empty users list
    Given there are no users in the system
    When the user requests the list
    Then the system returns an empty list
    And the system returns response 200

  Scenario: User without admin role filters by active status
    Given the user has role "USER"
    When they try to filter results using active
    Then the API should respond with 403 Forbidden
    And the message should indicate that active is a restricted field


  Scenario: Find existing user
    Given the provided name is correct
    And the endpoint is only for admin
    When the admin searches for the user
    Then all data is displayed
    And the system returns response 200

  Scenario: Single user not found
    Given the name does not exist
    When the admin searches for the user
    Then the system returns 404

 Scenario: Retrieve current user successfully
  Given the user is authenticated with a valid token
  When they request the current user details
  Then the system returns 200 

  Scenario: Successful user update
    Given the request accepts the name (id) and new details
    When the update is successful
    Then the system returns response 200

  Scenario: Update non-existent user
    Given the name does not exist
    When the update is attempted
    Then the system returns 404

  Scenario: Update roles restricted to admin
    Given a user requests a role update
    When the user is not an admin
    Then the system should reject the modification since its restricted to admin only

  Scenario: Update user with invalid input data
    Given the request body contains invalid name, departmentName, password, or role
    When the admin sends a request to update an existing user
    Then the system returns 400
    And the response should include validation error messages

  Scenario: Update using widely assigned username
    Given a new username is already used
    When the update is attempted
    Then the system returns 409

  Scenario: Successful user deletion
    Given the correct name is provided
    When the deletion is requested
    Then the user is deleted
    And the system returns response 200

  Scenario: Delete non-existent user
    Given the name does not exist
    When the deletion is attempted
    Then the system returns 404

  Scenario: Prevent deletion of user linked to main operations
    Given the user is linked to main operations
    When the deletion is attempted
    Then the system prevents deletion and triggers a warning 
    And returns 409

  Scenario: user deleting another user without authorization
    Given the user has role "USER"
    When they try to delete another user
    Then the system returns respond 403 Forbidden
    
