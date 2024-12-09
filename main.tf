terraform {
  required_version = ">= 1.5.7"

  required_providers {
	google = ">= 5.10"
  }
}

provider "google" {
  project = "${var.project_id}"
}

resource "google_firestore_database" "database" {
  name                    = "(default)"
  location_id             = "europe-central2"
  type                    = "FIRESTORE_NATIVE"
  delete_protection_state = "DELETE_PROTECTION_DISABLED"
  deletion_policy         = "DELETE"
}

resource "google_storage_bucket" "cloud-function-bucket" {
  name = "cloud-function-bucket-${var.project_id}"
  location = "us-central1"
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_object" "cloud-function-archive-DeleteTask" {
  name   = "cloud-function-archive-DeleteTask"
  bucket = google_storage_bucket.cloud-function-bucket.name
  source = "DeleteTask.zip"
}

resource "google_storage_bucket_object" "cloud-function-archive-EditTask" {
  name   = "cloud-function-archive-EditTask"
  bucket = google_storage_bucket.cloud-function-bucket.name
  source = "EditTask.zip"
}

resource "google_storage_bucket_object" "cloud-function-archive-GetAllTasks" {
  name   = "cloud-function-archive-GetAllTasks"
  bucket = google_storage_bucket.cloud-function-bucket.name
  source = "GetAllTasks.zip"
}

resource "google_storage_bucket_object" "cloud-function-archive-NewTask" {
  name   = "cloud-function-archive-NewTask"
  bucket = google_storage_bucket.cloud-function-bucket.name
  source = "NewTask.zip"
}

resource "google_storage_bucket_object" "cloud-function-archive-Notify" {
  name   = "cloud-function-archive-Notify"
  bucket = google_storage_bucket.cloud-function-bucket.name
  source = "Notify.zip"
}

resource "google_cloudfunctions2_function" "DeleteTask" {
  name        = "DeleteTask"
  location    = "us-central1"
  description = "Function to delete task"

  build_config {
    runtime = "nodejs20"
    entry_point = "DeleteTask"
    source {
      storage_source {
        bucket = google_storage_bucket.cloud-function-bucket.name
        object = google_storage_bucket_object.cloud-function-archive-DeleteTask.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
  depends_on = [google_firestore_database.database]
}

resource "google_cloudfunctions2_function" "EditTask" {
  name        = "EditTask"
  location    = "us-central1"
  description = "Function to edit task"

  build_config {
    runtime = "nodejs20"
    entry_point = "EditTask"
    source {
      storage_source {
        bucket = google_storage_bucket.cloud-function-bucket.name
        object = google_storage_bucket_object.cloud-function-archive-EditTask.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
  depends_on = [google_firestore_database.database]
}

resource "google_cloudfunctions2_function" "GetAllTasks" {
  name        = "GetAllTasks"
  location    = "us-central1"
  description = "Function to get all tasks"

  build_config {
    runtime = "nodejs20"
    entry_point = "GetAllTasks"
    source {
      storage_source {
        bucket = google_storage_bucket.cloud-function-bucket.name
        object = google_storage_bucket_object.cloud-function-archive-GetAllTasks.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
  depends_on = [google_firestore_database.database]
}

resource "google_cloudfunctions2_function" "NewTask" {
  name        = "NewTask"
  location    = "us-central1"
  description = "Function to add new task"

  build_config {
    runtime = "nodejs20"
    entry_point = "NewTask"
    source {
      storage_source {
        bucket = google_storage_bucket.cloud-function-bucket.name
        object = google_storage_bucket_object.cloud-function-archive-NewTask.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
  depends_on = [google_firestore_database.database]
}

resource "google_cloudfunctions2_function" "Notify" {
  name        = "Notify"
  location    = "us-central1"
  description = "Function to send email notifications"

  build_config {
    runtime = "nodejs20"
    entry_point = "Notify"
    source {
      storage_source {
        bucket = google_storage_bucket.cloud-function-bucket.name
        object = google_storage_bucket_object.cloud-function-archive-Notify.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
  depends_on = [google_firestore_database.database]
}

output "function_uri" {
  value = google_cloudfunctions2_function.Notify.service_config[0].uri
}

resource "google_cloud_scheduler_job" "SendNotification" {
  name         = "SendNotification"
  description  = "Scheduler for sending notification with upcoming tasks"
  schedule     = "0 0,8 * * *"
  region = "europe-west1"
  http_target {
    http_method = "POST"
    uri = google_cloudfunctions2_function.Notify.service_config[0].uri
  }
  depends_on = [google_cloudfunctions2_function.Notify]
}