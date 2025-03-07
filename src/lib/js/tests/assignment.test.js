import nock from 'nock';
import { getAssignments, updateAssignmentsSorting, newAssignmentData, formatSelectedDueDate, addAssignment, updateAssignment } from '$lib/js/home/assignments';
import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('$lib/js/')

describe('getAssignments', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should return assignments when API call is successful', async () => {
        const assignments = [
            { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', description: 'Description 1' },
            { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', description: 'Description 2' },
            { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', description: 'Description 3' },
        ];

        nock('http://127.0.0.1:3000')
            .get('/api/assignment/get')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, { assignments });

        // Sort expected array
        const sortedAssignments = updateAssignmentsSorting([...assignments], 'sort-type');

        const result = await getAssignments('auth-token', 'sort-type', true);
        expect(result).toEqual(sortedAssignments);
    });

    it('should handle API error with 401 status code', async () => {
        nock('http://127.0.0.1:3000')
            .get('/api/assignment/get')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, { error: 'Unauthorized' });

        await expect(getAssignments('auth-token', 'sort-type', true)).rejects.toThrow('Error while loading assignments: Unauthorized');
    });

    it('should handle API error with 500 status code', async () => {
        nock('http://127.0.0.1:3000')
            .get('/api/assignment/get')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, { error: 'Internal Server Error' });

        await expect(getAssignments('auth-token', 'sort-type', true)).rejects.toThrow('Error while loading assignments: Internal Server Error');
    });
});

describe('updateAssignmentsSorting', () => {
   it('should sort assignments based on subject correctly', () => {
       const assignments = [
           { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', status: "done", description: 'Description 3' },
           { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', status: "inProgress", description: 'Description 2' },
       ];
       const sortedAssignments = updateAssignmentsSorting([...assignments], 'subject');
       expect(sortedAssignments).toEqual([
           { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', status: "done", description: 'Description 3' },
       ]);
   });

   it('should sort assignments based on date correctly', () => {
       const assignments = [
           { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', status: "done", description: 'Description 3' },
           { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', status: "inProgress", description: 'Description 2' },
       ];
       const sortedAssignments = updateAssignmentsSorting([...assignments], 'date');
       expect(sortedAssignments).toEqual([
           { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', status: "done", description: 'Description 3' },
       ]);
   });

   it('should sort assignments based on status correctly', () => {
       const assignments = [
           { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', status: "done", description: 'Description 3' },
           { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', status: "inProgress", description: 'Description 2' },
       ];
       const sortedAssignments = updateAssignmentsSorting([...assignments], 'status');
       expect(sortedAssignments).toEqual([
           { title: 'Assignment 1', dueDate: '01.01.2026', subject: 'Math', priority: 'Medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 2', dueDate: '02.01.2026', subject: 'English', priority: 'Low', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 3', dueDate: '03.01.2026', subject: 'Science', priority: 'High', status: "done", description: 'Description 3' },
       ]);
   });

   it('should sort assignments based on priority correctly', () => {
       const assignments = [
           { title: 'Assignment 3', dueDate: '01.01.2026', subject: 'Math', priority: 'medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 2', dueDate: '03.01.2026', subject: 'Science', priority: 'high', status: "done", description: 'Description 3' },
           { title: 'Assignment 5', dueDate: '02.01.2026', subject: 'English', priority: 'lowest', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 4', dueDate: '02.01.2026', subject: 'English', priority: 'low', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 1', dueDate: '02.01.2026', subject: 'English', priority: 'highest', status: "inProgress", description: 'Description 2' },
       ];
       const sortedAssignments = updateAssignmentsSorting([...assignments], 'priority');
       expect(sortedAssignments).toEqual([
           { title: 'Assignment 1', dueDate: '02.01.2026', subject: 'English', priority: 'highest', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 2', dueDate: '03.01.2026', subject: 'Science', priority: 'high', status: "done", description: 'Description 3' },
           { title: 'Assignment 3', dueDate: '01.01.2026', subject: 'Math', priority: 'medium', status: "open", description: 'Description 1' },
           { title: 'Assignment 4', dueDate: '02.01.2026', subject: 'English', priority: 'low', status: "inProgress", description: 'Description 2' },
           { title: 'Assignment 5', dueDate: '02.01.2026', subject: 'English', priority: 'lowest', status: "inProgress", description: 'Description 2' },
       ]);
   });
});

describe('formatSelectedDueDate', () => {
    it('should format the selected due date to DD.MM.YYYY', () => {
        const assignmentData = {
            title: 'Assignment 1',
            dueDate: '2025-01-01',
            subject: 'Math',
            priority: 'Medium',
            status: "open",
            description: 'Description 1'
        }

        newAssignmentData.title = assignmentData.title;
        newAssignmentData.dueDate = assignmentData.dueDate;

        const formattedDate = formatSelectedDueDate();
        expect(formattedDate).toBe('01.01.2025');
    });
});

describe('addAssignment', () => {
    afterEach(() => {
        nock.cleanAll();
        newAssignmentData.set({
            title: "",
            dueDate: "",
            subject: "math",
            priority: "medium",
            description: ""
        });
    });

    it('should reset data and return false on Escape key press', async () => {
       const mockEvent = { key: "Escape" };
       const result = await addAssignment('auth-token', mockEvent, true);
       expect(result).toBe(false);
       expect(newAssignmentData.title).toBe("");
    });

    it('should make a successful API call', async () => {
        const mockEvent = { target: { classList: {contains: () => true } } };
        const mockDateString = "2025-03-06"
        const mockData = {
            title: 'Assignment 1',
            dueDate: mockDateString,
            subject: 'Math',
            priority: 'Medium',
            description: 'Description 1'
        };
        newAssignmentData.title = mockData.title;
        newAssignmentData.dueDate = mockDateString;
        newAssignmentData.subject = mockData.subject;
        newAssignmentData.priority = mockData.priority;
        newAssignmentData.description = mockData.description;

        nock('http://127.0.0.1:3000')
            .post('/api/assignment/new', {
                priority: mockData.priority,
                subject: mockData.subject,
                title: mockData.title,
                dueDate: "06.03.2025",
                description: mockData.description
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader("Content-Type", "application/json")
            .reply(200, { success: true });

        const result = await addAssignment('auth-token', mockEvent, true);
        expect(result).toBe(false);
        expect(newAssignmentData.title).toBe("");
    });

    it('should handle API error with 400 status code', async () => {
        const mockEvent = { target: { classList: {contains: () => true } } };
        const mockDateString = "2025-03-06"
        const mockData = {
            title: 'Assignment 1',
            dueDate: mockDateString,
            subject: 'Math',
            priority: 'Medium',
            description: 'Description 1'
        };
        newAssignmentData.title = mockData.title;
        newAssignmentData.dueDate = mockDateString;
        newAssignmentData.subject = mockData.subject;
        newAssignmentData.priority = mockData.priority;
        newAssignmentData.description = mockData.description;

        nock('http://127.0.0.1:3000')
            .post('/api/assignment/new', {
                priority: mockData.priority,
                subject: mockData.subject,
                title: mockData.title,
                dueDate: "06.03.2025",
                description: mockData.description
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader("Content-Type", "application/json")
            .reply(400, { error: "Invalid inputs" });

        await expect(addAssignment('auth-token', mockEvent, true)).rejects.toThrow('Error while adding assignment: Invalid inputs');
    });

    it('should handle API error with 409 status code', async () => {
        const mockEvent = { target: { classList: {contains: () => true } } };
        const mockDateString = "2025-03-06"
        const mockData = {
            title: 'Assignment 1',
            dueDate: mockDateString,
            subject: 'Math',
            priority: 'Medium',
            description: 'Description 1'
        };
        newAssignmentData.title = mockData.title;
        newAssignmentData.dueDate = mockDateString;
        newAssignmentData.subject = mockData.subject;
        newAssignmentData.priority = mockData.priority;
        newAssignmentData.description = mockData.description;

        nock('http://127.0.0.1:3000')
            .post('/api/assignment/new', {
                priority: mockData.priority,
                subject: mockData.subject,
                title: mockData.title,
                dueDate: "06.03.2025",
                description: mockData.description
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader("Content-Type", "application/json")
            .reply(409, { error: "Assignment already exists" });

        await expect(addAssignment('auth-token', mockEvent, true)).rejects.toThrow('Error while adding assignment: Assignment already exists');
    });

    it('should handle API error with 401 status code', async () => {
        const mockEvent = { target: { classList: {contains: () => true } } };
        const mockDateString = "2025-03-06"
        const mockData = {
            title: 'Assignment 1',
            dueDate: mockDateString,
            subject: 'Math',
            priority: 'Medium',
            description: 'Description 1'
        };
        newAssignmentData.title = mockData.title;
        newAssignmentData.dueDate = mockDateString;
        newAssignmentData.subject = mockData.subject;
        newAssignmentData.priority = mockData.priority;
        newAssignmentData.description = mockData.description;

        nock('http://127.0.0.1:3000')
            .post('/api/assignment/new', {
                priority: mockData.priority,
                subject: mockData.subject,
                title: mockData.title,
                dueDate: "06.03.2025",
                description: mockData.description
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader("Content-Type", "application/json")
            .reply(401, { error: "Unauthorized" });

        await expect(addAssignment('auth-token', mockEvent, true)).rejects.toThrow('Error while adding assignment: Unauthorized');
    });

    it('should handle API error with 500 status code', async () => {
        const mockEvent = { target: { classList: {contains: () => true } } };
        const mockDateString = "2025-03-06"
        const mockData = {
            title: 'Assignment 1',
            dueDate: mockDateString,
            subject: 'Math',
            priority: 'Medium',
            description: 'Description 1'
        };
        newAssignmentData.title = mockData.title;
        newAssignmentData.dueDate = mockDateString;
        newAssignmentData.subject = mockData.subject;
        newAssignmentData.priority = mockData.priority;
        newAssignmentData.description = mockData.description;

        nock('http://127.0.0.1:3000')
            .post('/api/assignment/new', {
                priority: mockData.priority,
                subject: mockData.subject,
                title: mockData.title,
                dueDate: "06.03.2025",
                description: mockData.description
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader("Content-Type", "application/json")
            .reply(500, { error: "Internal Server Error" });

        await expect(addAssignment('auth-token', mockEvent, true)).rejects.toThrow('Error while adding assignment: Internal Server Error');
    });
});

describe('updateAssignment', () => {
    it('should make a successful API call', async () => {
        const mockAssignment = {
            "_id": "67ca23c4302d5ff21cf74fdb",
            "userId": "9ffdbby3wwyr4qeabpzq",
            "title": "Test",
            "dueDate": "13.03.2025",
            "subject": "math",
            "status": "open",
            "priority": "lowest",
            "__v": 0,
            "expire": null
        };

        nock('http://127.0.0.1:3000')
            .put('/api/assignment/update', {
                "_id": "67ca23c4302d5ff21cf74fdb",
                "userId": "9ffdbby3wwyr4qeabpzq",
                "title": "Test",
                "dueDate": "13.03.2025",
                "subject": "math",
                "status": "open",
                "priority": "lowest",
                "__v": 0,
                "expire": null
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader("Content-Type", "application/json")
            .reply(200);

        const result = await updateAssignment('auth-token', mockAssignment, true);
        expect(result).toBe(true);
    });

    it('should handle API error with status code 404', async () => {

    });
});