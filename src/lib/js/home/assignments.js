import {logout} from "$lib/js/auth.js";
import {writable} from "svelte/store";

let expandedAssignment = null;

let newNotification = null;

/**
 * Sets the callback function for the new notification system.
 *
 * The callback function should accept 3 parameters: type, title, and message.
 * The type parameter should be one of "error", "warning", or "info".
 * The title and message parameters are the title and message of the notification to be displayed.
 *
 * If called with a falsy value, the callback function will not be changed.
 *
 * @param {Function} callback - The callback function to be called when a new notification is to be displayed.
 */
export function newNotificationTA(callback) {
    if (callback) {
        newNotification = callback;
    }
}

export const newAssignmentData = writable({
    title: "",
    dueDate: "",
    subject: "math",
    priority: "medium",
    description: ""
});

/**
 * Fetches all assignments from the API and updates the store.
 *
 * @param {string} authToken The authentication token to use for the request.
 * @param {string} sortType The type of sorting to apply to the assignments.
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<void>}
 */
export async function getAssignments(authToken, sortType, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/assignment/get', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            return updateAssignmentsSorting(data.assignments, sortType);
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return [];
            }

            throw new Error(`Error while loading assignments: Unauthorized`);
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while loading assignments", err.error);
                return [];
            }

            throw new Error(`Error while loading assignments: Internal Server Error`);
        } else {
            if (!testing) newNotification("error", "Unable to load assignments", "There was an unexpected error. Please try again!");

            return [];
        }
    }
}

/**
 * Handles the addition of a new assignment.
 *
 * If the user presses the escape key, the `addAssignment` store is set to `false`
 * and the `newAssignmentData` store is reset to its default values.
 *
 * If the user clicks the "Add Assignment" button, a POST request is sent to the
 * server to add the assignment. If the request is successful, the `addAssignment`
 * store is set to `false` and the `newAssignmentData` store is reset to its default
 * values. Additionally, the `assignments` store is updated by calling
 * `getAssignments`.
 *
 * @param {string} authToken The authentication token to use for the request.
 * @param {KeyboardEvent} e The keyboard event that triggered the function.
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<void>}
 */
export async function addAssignment(authToken, e, testing = false) {
    if (e.key === "Escape") {
        newAssignmentData.title = "";
        newAssignmentData.dueDate = "";
        newAssignmentData.subject = "math";
        newAssignmentData.priority = "medium";
        newAssignmentData.description = "";

        return false;
    } else if (e.target.classList.contains('addAssignment')) {
        if (authToken) {
            newAssignmentData.dueDate = formatSelectedDueDate();
            const response = await fetch('http://127.0.0.1:3000/api/assignment/new', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAssignmentData)
            });

            if (response.status === 200) {
                newAssignmentData.title = "";
                newAssignmentData.dueDate = "";
                newAssignmentData.subject = "math";
                newAssignmentData.priority = "medium";
                newAssignmentData.description = "";

                return false;
            } else if (response.status === 400) {
                if (!testing) {
                    const err = await response.json();
                    newNotification("error", "Invalid assignment", err.error);
                    return true;
                }

                throw new Error("Error while adding assignment: Invalid inputs");
            } else if (response.status === 409) {
                if (!testing) {
                    const err = await response.json();
                    newNotification("error", "Assignment already exists", err.error);
                    return true;
                }

                throw new Error("Error while adding assignment: Assignment already exists");
            } else if (response.status === 401) {
                if (!testing) {
                    const err = await response.json();
                    newNotification("error", "Unauthorized", err.error);
                    setTimeout(() => {logout();}, 5000);
                    return false;
                }

                throw new Error("Error while adding assignment: Unauthorized");
            } else if (response.status === 500) {
                if (!testing) {
                    const err = await response.json();
                    newNotification("error", "Error while adding assignment", err.error);
                    return true;
                }

                throw new Error("Error while adding assignment: Internal Server Error");
            } else {
                if (!testing) newNotification("error", "Unable to add assignment", "There was an unexpected error. Please try again!");
                return true;
            }
        }
    }

    return true;
}

/**
 * Updates an assignment in the database.
 *
 * @param {string} authToken The authentication token to use for the request.
 * @param {assignment} assignment The assignment to update.
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<void>}
 */
export async function updateAssignment(authToken, assignment, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/assignment/update', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({assignment: assignment})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 404) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Assignment not found", err.error);
                return false;
            }

            throw new Error("Error while updating assignment: Assignment not found");
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            }

            throw new Error("Error while updating assignment: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while updating your assignment", err.error);
                return false;
            }

            throw new Error("Error while updating assignment: Internal Server Error");
        } else {
            if (!testing) newNotification("error", "Unable to update assignment", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Deletes an assignment from the database.
 *
 * @param authToken
 * @param {number} index The index of the assignment in the `assignments` store.
 * @param assignments
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<void>}
 */
export async function deleteAssignment(authToken, index, assignments, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/assignment/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({assignment: assignments[index]})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 404) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Assignment not found", err.error);
                return false;
            }

            throw new Error("Error while deleting assignment: Assignment not found");
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            }

            throw new Error("Error while deleting assignment: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while deleting your assignment", err.error);
                return false;
            }

            throw new Error("Error while deleting assignment: Internal Server Error");
        } else {
            if (!testing) newNotification("error", "Unable to delete assignment", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Updates the sorting of the assignments according to the current sort type.
 *
 * @function
 * @private
 */
export function updateAssignmentsSorting(assignments, sortType) {
    let sortedAssignments = [...assignments];

    if (sortType === "subject") {
        sortedAssignments.sort((a, b) => a.subject.localeCompare(b.subject));
    } else if (sortType === "date") {
        /**
         * Takes a date string in the format "DD.MM.YYYY" and returns a
         * corresponding Date object.
         *
         * @param {string} dateString - The date string to parse.
         * @returns {Date} The parsed Date object.
         *
         * @example
         * parseDate("01.01.2020") // => Date('2020-01-01')
         */
        const parseDate = (dateString) => {
            const [day, month, year] = dateString.split(".");
            return new Date(`${year}-${month}-${day}`);
        };

        sortedAssignments.sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate));
    } else if (sortType === "status") {
        const statusOrder = { open: 0, inProgress: 1, done: 2 };
        sortedAssignments.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    } else if (sortType === "priority") {
        const priorityOrder = { lowest: 4, low: 3, medium: 2, high: 1, highest: 0 };
        sortedAssignments.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
        sortedAssignments.sort((a, b) => a.subject.localeCompare(b.subject));
    }

    return sortedAssignments;
}

/**
 * Formats the selected due date to "DD.MM.YYYY".
 *
 * @returns {string} The formatted due date.
 */
export function formatSelectedDueDate(date = newAssignmentData.dueDate) {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
}