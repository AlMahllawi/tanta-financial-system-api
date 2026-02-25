Feature: Transactions Management
  As a user or admin
  I want to create, manage, and view transactions
  So that I can process and share requests properly

  Scenario: Create a valid transaction
    Given the request contains an optional department, type, description, and document
    And the receiver is specified as another user
    When the new transaction is created
    Then the system returns 201

  Scenario: Naming conflict on creation
    Given the name already exists
    When the new transaction is attempted
    Then the system requires the name to be changed
    And the system returns 201

  Scenario: Validation fails when title or type name is invalid
    Given the user provides transaction data
    And the title is too short or does not match the required pattern
    Or the type Name is too short or does not match the required pattern
    When the user submits the request
    Then the system returns 400 Bad Request
  
  Scenario: Validation fails when priority value is invalid
    Given the user provides a priority not in HIGH, MEDIUM, or LOW
    When the user submits the request
    Then the system returns 400 

  Scenario: Missing department details on transaction
    Given the department does not exist
    When the new transaction is attempted
    Then the system requires validating the department
    And the system returns 404

  Scenario: Prevent creating a transaction with a duplicated title
    Given a transaction already exists with the same title
    When the user attempts to create a new transaction using the same title
    Then the system rejects the request
    And returns 409
    And the message indicates that the title must be unique

  Scenario: User views all personal transactions
    Given the user requests to view their transactions
    When the system retrieves the transactions
    Then all the user's transactions are displayed
    And the status, type, and created_at fields are shown
    And the system returns response 200

  Scenario: Admin views all transactions
    Given the user has admin privileges
    When they request to view all transactions
    Then all users' transactions are displayed
    And the status, type, and created_at fields are shown
    And the system returns response 200

  Scenario: Valid existing transaction viewing module
    Given the name is correct and the user is authorized to view it
    When the details are requested
    Then the detailed transaction data is shown
    And the system returns response 200

  Scenario: Transaction name not found on view
    Given the valid name does not exist
    When the request is processed
    Then the system returns 404

  Scenario: Unauthorized transaction viewing
    Given the user attempts to view a transaction they do not own
    When the request is processed
    Then they cannot view another user's transactions 
    And the systems returns 403

  Scenario: Successful valid transaction update
    Given the transaction name is correct and the transaction has not been forwarded
    When the update is submitted manually
    Then the information updates properly
    And the system returns response 200

  Scenario: Attempting to update a forwarded transaction
    Given the transaction has already been forwarded
    When an update is attempted
    Then the update is rejected

  Scenario: Updating a non-existent transaction
    Given the transaction is not found
    When the update is attempted
    Then the system returns 404

  Scenario: Fail to create a transaction when the provided type does not exist
    Given the user provides a transaction type name that is not registered
    When the transaction creation request is submitted
    Then the system returns 404 
    And the message indicates that the transaction type was not found

  Scenario: Delete a valid un-forwarded transaction
    Given the transaction has not been forwarded to anyone yet
    When the deletion process is triggered
    Then the deletion succeeds
    And the system returns response 200

  Scenario: Delete a transaction that cannot be found
    Given the transaction is missing
    When the deletion process runs
    Then the system returns 404

  Scenario: Cannot delete a transaction that has forwards
    When the user deletes transaction 
    Then the response should be 409
    And the error key should be "TRANSACTION_HAS_FORWARDS"

  Scenario: Valid document attachment to transaction
    Given an existing document or new file is selected
    And the transaction is correct
    And the user is part of the transaction participants
    And the file type is compatible
    When the file is attached
    Then the process is successful
    And the system returns response 200

  Scenario: Cannot update file read by recipient
    Given the receiver has already viewed the file
    When an update is attempted
    Then the system rejects it and returns 403

  Scenario: Cannot attach file after request result
    Given the request has already been resolved or replied to
    When an update is attempted
    Then the system rejects it and returns 403

  Scenario: User is not a participant in the transaction
  When the user tries to access transaction
  Then the response should be 403
  And the error key should be "NOT_TRANSACTION_PARTICIPANT"

  Scenario: Attach to non-existent transaction
    Given the transaction does not exist
    When the attachment process happens
    Then the system returns 404

  Scenario: Authorized successful document detach
    Given the transaction exists
    And the user is the original uploader of the document
    When the detach is requested
    Then the document is detached successfully
    And the system returns response 200

  Scenario: Attempting detach when recipient viewed file
    Given the recipient has watched the file
    When the detach runs
    Then it is rejected, returning 403

  Scenario: Attempting detach after request result
    Given the request has been replied to
    When the detach runs
    Then it is rejected, returning 403

  Scenario: Detach requested by unauthorized user
    Given the user is not part of the transaction or not the original uploader
    When the detach runs
    Then it is rejected, returning 403

  Scenario: Detach with non-existent transaction
    Given the transaction does not exist
    When the detach runs
    Then the system returns 404

  Scenario: Transaction creator not found
    Given the creator ID is invalid
    When the new transaction is attempted
    Then the system returns 401

  Scenario: Document not found on attachment
    Given the user attempts to attach a document
    When the requested document does not exist
    Then the system returns 404

  Scenario: Transaction document not found on creation
    Given the request references a non-existent document ID
    When the new transaction is attempted
    Then the system returns 404

  Scenario: Update transaction to non-existent type
    Given the transaction exists but the new type does not
    When the update is attempted with a non-existent type
    Then the system returns 404

  Scenario: Delete transaction that has forwards
    Given the transaction has been forwarded
    When the deletion process is triggered
    Then the system returns 409

  Scenario: Unauthorized transaction update or delete
    Given the user is not the transaction creator
    When the update or deletion is attempted
    Then the system returns 403
