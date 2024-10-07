//
//  AppIntent.swift
//  SaplingWidget
//
//  Created by Eshaan Shetty on 9/25/24.
//

import WidgetKit
import AppIntents
import FirebaseFirestore

// Existing configuration for your widget
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configuration"
    static var description = IntentDescription("This is an example widget.")

    // An example configurable parameter
    @Parameter(title: "Favorite Emoji", default: "😃")
    var favoriteEmoji: String
}


// New AppIntent for the reload action
struct ReloadTimelineIntent: AppIntent {
    static var title: LocalizedStringResource = "Reload Widget Timeline"

    func perform() async throws -> some IntentResult {
        WidgetCenter.shared.reloadAllTimelines() // Reload the widget timeline
        return .result()
    }
}

struct ToggleTaskCompletionIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Task Completion"
    
    @Parameter(title: "Task ID")
    var taskId: String
    
    init() {}
    
    init(taskId: String) {
        self.taskId = taskId
    }
    
    func perform() async throws -> some IntentResult {
        let userDefaults = UserDefaults(suiteName: "group.sapling")
        guard let userId = userDefaults?.string(forKey: "userId"), !userId.isEmpty else {
            throw IntentError.userNotFound
        }
        
        let db = Firestore.firestore()
        let taskRef = db.collection("users").document(userId).collection("tasks").document(taskId)
        
        do {
            // Get today's date in the format used in Firestore
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let todayString = dateFormatter.string(from: Date())
            
            // Remove today's date from the task's dates array
            try await taskRef.updateData([
                "dates": FieldValue.arrayRemove([todayString])
            ])
            
            // Check if the task's dates array is now empty
            let updatedTaskDoc = try await taskRef.getDocument()
            if let dates = updatedTaskDoc.data()?["dates"] as? [String], dates.isEmpty {
                // If dates array is empty, delete the task
                try await taskRef.delete()
            }
            
            // Increase the user's credits by 1
            let statsRef = db.collection("users").document(userId).collection("stats").document("userStats")
            try await statsRef.setData([
                          "credits": FieldValue.increment(Int64(1)),
                          "tasksCompleted": FieldValue.increment(Int64(1)) // Increment tasksCompleted by 1
                      ], merge: true)
            
            // Reload the widget
            WidgetCenter.shared.reloadTimelines(ofKind: "SaplingWidget")
            
            return .result()
        } catch {
            throw IntentError.databaseError(error)
        }
    }
    
    enum IntentError: Error {
        case userNotFound
        case databaseError(Error)
    }
}
