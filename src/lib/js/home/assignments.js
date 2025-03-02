import {writable} from "svelte/store";

let expandedAssignment = null;

export const newAssignmentData = writable({
    title: "",
    dueDate: new Date(),
    subject: "math",
    priority: "medium",
    description: ""
});

/**
 * Fetches all assignments from the API and updates the store.
 *
 * @returns {Promise<void>}
 */
export async function getAssignments(authToken, sortType) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-assignments', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            return updateAssignmentsSorting(data.assignments, sortType);
        } else {
            // showErrorMsg('Unable to fetch assignments.');
            // Add error log update
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
 *
 * @returns {Promise<void>}
 */
export async function addAssignment(authToken, e) {
    if (e.key === "Escape") {
        newAssignmentData.set({
            title: "",
            dueDate: new Date(),
            subject: "math",
            priority: "medium",
            description: ""
        });
        return false;
    } else if (e.target.classList.contains('addAssignment')) {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/add-assignment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAssignmentData)
            });

            if (response.status === 200) {
                newAssignmentData.set({
                    title: "",
                    dueDate: new Date(),
                    subject: "math",
                    priority: "medium",
                    description: ""
                });
                return false;
            } else {
                // return 'Unable to add assignment.';
                // Add error log update
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
 *
 * @returns {Promise<void>}
 */
export async function updateAssignment(authToken, assignment) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/update-assignment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assignment })
        });

        if (response.status === 200) {
            return true;
        } else {
            // showErrorMsg('Unable to update assignment.');
            // Add error log update
            return false;
        }
    }
}

/**
 * Deletes an assignment from the database.
 *
 * @param authToken
 * @param {number} index The index of the assignment in the `assignments` store.
 *
 * @returns {Promise<void>}
 */
export async function deleteAssignment(authToken, index, assignments) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/delete-assignment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({assignment: assignments[index]})
        });

        if (response.status === 200) {
            return true;
        } else {
            // showErrorMsg('Unable to delete assignment.');
            // Add error log update
            return false;
        }
    }
}

/**
 * Toggle the visibility of an assignment's details.
 *
 * @param {assignment} expandedAssignment The currently expanded assignment.
 * @param {number} index The index of the assignment in the assignments array.
 * @param {Event} e The event that triggered this function.
 *
 * @returns {Promise<void>}
 */
export function toggleAssignmentDetails(expandedAssignment, index, e) {
    if (e.target.closest('.assignment-details-wrapper')) {
        return null;
    }

    return expandedAssignment === index ? null : index;
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
 * Formats the selected due date as "DD.MM.YYYY".
 *
 * @returns {string} The formatted due date.
 */
export function formatSelectedDueDate() {
    const dateObj = new Date();
    return `${dateObj.getDate()}.${dateObj.getMonth() + 1}.${dateObj.getFullYear()}`;
}