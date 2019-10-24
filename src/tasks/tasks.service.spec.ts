import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { NotFoundException } from '@nestjs/common';

const mockUser = { id: 1, username: 'Test User' };
const mockTask = {
  id: 1,
  title: 'Task title',
  description: 'Task description',
};

const mockTestRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

describe('TasksService', () => {
  let tasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTestRepository },
      ],
    }).compile();

    tasksService = await module.get<TasksService>(TasksService);
    taskRepository = await module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks', () => {
    it('gets all tasks from the repository', async () => {
      taskRepository.getTasks.mockResolvedValue('some value');
      expect(taskRepository.getTasks).not.toHaveBeenCalled();

      const filters: GetTasksFilterDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'Some search query',
      };

      const result = await tasksService.getTasks(filters, mockUser);

      expect(taskRepository.getTasks).toHaveBeenCalled();
      expect(result).toEqual('some value');
    });
  });

  describe('getTaskById', () => {
    describe('when task exists', () => {
      it('calls tasksRepository.findOne() and return the task', async () => {
        taskRepository.findOne.mockResolvedValue(mockTask);

        const result = await tasksService.getTaskById(mockTask.id, mockUser);
        expect(result).toEqual(mockTask);

        expect(taskRepository.findOne).toHaveBeenCalledWith({
          where: { id: mockTask.id, userId: mockUser.id },
        });
      });
    });

    describe('when task does not exist', () => {
      it('throws an error', () => {
        taskRepository.findOne.mockResolvedValue(null);

        expect(tasksService.getTaskById(mockTask.id, mockUser)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('createTask', () => {
    it('calls taskRepository.createTask() and returns the result', async () => {
      taskRepository.createTask.mockResolvedValue(mockTask);

      expect(taskRepository.createTask).not.toHaveBeenCalled();

      const createTaskDto = { title: 'Test title', description: 'Test desc' };
      const result = await tasksService.createTask(createTaskDto, mockUser);

      expect(taskRepository.createTask).toHaveBeenCalledWith(
        createTaskDto,
        mockUser,
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('deleteTask', () => {
    describe('when task exists', () => {
      it('calls tasksRepository.findOne() and return the task', async () => {
        taskRepository.delete.mockResolvedValue({ affected: 1 });

        expect(taskRepository.delete).not.toHaveBeenCalled();

        await tasksService.deleteTask(mockTask.id, mockUser);

        expect(taskRepository.delete).toHaveBeenCalledWith({
          id: mockTask.id,
          userId: mockUser.id,
        });
      });
    });

    it('throws an error', () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 });

      expect(tasksService.deleteTask(mockTask.id, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('updates task status', async () => {
      const save = jest.fn();
      tasksService.getTaskById = jest.fn().mockResolvedValue({
        status: TaskStatus.OPEN,
        save,
      });

      expect(tasksService.getTaskById).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();

      const result = await tasksService.updateTaskStatus(
        mockTask.id,
        TaskStatus.IN_PROGRESS,
        mockUser,
      );

      expect(tasksService.getTaskById).toHaveBeenCalledWith(
        mockTask.id,
        mockUser,
      );
      expect(save).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.IN_PROGRESS);
    });
  });
});
