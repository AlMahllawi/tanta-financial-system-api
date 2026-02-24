Feature: Departments Management
  As an admin or authorized user
  I want to manage and view departments
  So that I can organize the system correctly

  Scenario: Create a valid department
    Given the request contains a valid department name
    When the department is created
    Then it appears in the departments list
    And the system returns response 201 upon success

  Scenario: Prevent duplicate department name
    Given a department already exists with the same name
    When a request is made to create a department with the same name
    Then the system prevents the creation
    And the system returns 409

  Scenario: View populated departments list
    Given there are existing departments
    When the user requests to view all departments
    Then all departments are displayed as a list
    And the system returns response 200



  Scenario: Find existing department by name
    Given the user provides a correct department name
    When the system searches for the department
    Then the department and its details are displayed
    And the system returns response 200

  Scenario: Department not found
    Given the user provides a name that does not exist
    When the system searches for the department
    Then the system returns 404

  Scenario: Update existing department
    Given the request contains the old department name and update details
    When the update is processed successfully
    Then the system returns response 200

  Scenario: Update non-existent department
    Given the department does not exist
    When the admin attempts an update
    Then the system returns 404

  Scenario: Update to an already existing name
    Given the new name already exists
    When the admin attempts an update
    Then the system returns 409

  Scenario: Successful department deletion
    Given the department exists and delete is requested using its name
    When the deletion is successful
    Then the system returns response 200

  Scenario: Deleting a department linked to transactions
    Given the department is used in other actual and past transactions
    When the admin attempts a deletion
    Then the system prevents the deletion and asks for permission or triggers alert and returns 409
    
  Scenario: Delete non-existent department
    Given the name does not exist
    When the admin attempts a deletion
    Then the system returns 404

  Scenario: Manager user not found
    Given the request assigns a manager to the department
    When the manager user ID does not exist
    Then the system returns 404

  Scenario: Manager already assigned to a department
    Given the assigned manager already manages another department
    When the update is attempted
    Then the system returns 409

  Scenario: Manager is not a member of the department
    Given the assigned manager does not belong to this department
    When the update is attempted
    Then the system returns 409
