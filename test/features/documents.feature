Feature: Documents Management
  As a user
  I want to upload and manage documents
  So that I can attach them to transactions or view them

  Scenario: Successful file upload
    Given the file is a PDF/Images/Word or specified valid type
    And the file size is within the allowed limits
    When the upload is successful
    Then the document is stored in the system
    And the system returns response 200

  Scenario: Invalid file type on upload
    Given the file type is invalid
    When the upload is attempted
    Then the system returns 400

  Scenario: Uploading without file
    Given no file is provided
    When the upload is attempted
    Then the system returns 404

  Scenario: View populated documents list
    Given the endpoint requires a user token
    When the user requests their uploaded documents
    Then the system returns only the user's documents list
    And the system returns response 200 upon success

  Scenario: View empty documents list
    Given the user has no documents
    When the user requests their documents
    Then the system returns an empty list
    And the system returns response 200

  Scenario: Retrieve an existing document
    Given the provided name is correct
    And the endpoint is secure so users cannot view others' documents
    When the document is requested
    Then the data is displayed
    And the system returns response 200

  Scenario: Get document not found
    Given the name does not exist
    When the document is requested
    Then the system returns 404

  Scenario: Successful document deletion
    Given the document exists
    When the deletion is successful
    Then the system returns response 200

  Scenario: Prevent deletion of documents linked to transactions
    Given the document is linked to a transaction
    When the deletion is attempted
    Then the deletion should be prevented

  Scenario: Delete non-existent document
    Given the provided ID does not exist
    When the deletion is attempted
    Then the system returns 404

  Scenario: Successful file download
    Given the document ID exists
    When the user requests to download the document
    Then the document is downloaded successfully
    And the system returns response 200

  Scenario: Requesting a non-existent document download
    Given the document ID does not exist
    When the user requests to download the document
    Then the system returns 404

  Scenario: Document uploader not found
    Given the uploading user cannot be verified
    When the upload is attempted
    Then the system returns 404
