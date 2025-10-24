# Lark CoreHR APIs

This document covers the CoreHR APIs for managing employee data, HR operations, and organizational information in Lark.

## Table of Contents

1. [Overview](#overview)
2. [Employee Management APIs](#employee-management-apis)
3. [Department Management APIs](#department-management-apis)
4. [Job Management APIs](#job-management-apis)
5. [Employment Management APIs](#employment-management-apis)
6. [Compensation Management APIs](#compensation-management-apis)
7. [Performance Management APIs](#performance-management-apis)
8. [Leave Management APIs](#leave-management-apis)
9. [Organizational Structure APIs](#organizational-structure-apis)
10. [Required Scopes](#required-scopes)
11. [Implementation Examples](#implementation-examples)

## Overview

The Lark CoreHR APIs allow you to:
- Manage employee profiles and information
- Handle organizational structure and departments
- Manage job positions and employment data
- Process compensation and benefits
- Track performance and reviews
- Manage leave requests and attendance
- Access HR analytics and reporting

**Base URL**: `https://open.feishu.cn/open-apis/corehr/v1`

## Employee Management APIs

### Create Employee

```http
POST /corehr/v1/employees
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "employee_type_id": "6890452208593372679",
  "worker_id": "1000001",
  "employee_number": "EMP001",
  "status": {
    "id": "6890452208593372680",
    "name": [
      {
        "lang": "zh-CN",
        "value": "在职"
      },
      {
        "lang": "en-US",
        "value": "Active"
      }
    ]
  },
  "hire_date": "2024-01-15",
  "probation_start_date": "2024-01-15",
  "probation_end_date": "2024-04-15",
  "conversion_date": "2024-04-16",
  "overboard_date": "",
  "departure_date": "",
  "departure_reason": "",
  "departure_notes": "",
  "contract_start_date": "2024-01-15",
  "contract_end_date": "2025-01-14",
  "contract_sign_times": 1,
  "personal_profile": {
    "gender": {
      "id": "6890452208593372681",
      "name": [
        {
          "lang": "zh-CN",
          "value": "男"
        },
        {
          "lang": "en-US",
          "value": "Male"
        }
      ]
    },
    "date_of_birth": "1990-05-15",
    "nationality": {
      "id": "6890452208593372682",
      "name": [
        {
          "lang": "zh-CN",
          "value": "中国"
        },
        {
          "lang": "en-US",
          "value": "China"
        }
      ]
    },
    "race": "",
    "marital_status": {
      "id": "6890452208593372683",
      "name": [
        {
          "lang": "zh-CN",
          "value": "已婚"
        },
        {
          "lang": "en-US",
          "value": "Married"
        }
      ]
    },
    "phone": {
      "area_code": {
        "id": "6890452208593372684",
        "name": [
          {
            "lang": "zh-CN",
            "value": "+86"
          }
        ]
      },
      "phone_number": "13800138000"
    },
    "email": "john.doe@company.com",
    "address": {
      "country_region_id": "6890452208593372685",
      "region_id": "6890452208593372686",
      "city_id": "6890452208593372687",
      "distinct_id": "6890452208593372688",
      "address_line_1": "Building A, Floor 10",
      "address_line_2": "Tech Park",
      "address_line_3": "",
      "address_line_4": "",
      "address_line_5": "",
      "address_line_6": "",
      "address_line_7": "",
      "address_line_8": "",
      "address_line_9": "",
      "postal_code": "100000"
    },
    "bank_account_number": "6222021234567890123",
    "bank_name": "China Construction Bank",
    "social_security_number": "110101199005151234",
    "national_id_number": "110101199005151234"
  },
  "emergency_contact": [
    {
      "name": [
        {
          "lang": "zh-CN",
          "value": "张三"
        },
        {
          "lang": "en-US",
          "value": "Zhang San"
        }
      ],
      "relationship": {
        "id": "6890452208593372689",
        "name": [
          {
            "lang": "zh-CN",
            "value": "配偶"
          },
          {
            "lang": "en-US",
            "value": "Spouse"
          }
        ]
      },
      "phone": {
        "area_code": {
          "id": "6890452208593372684",
          "name": [
            {
              "lang": "zh-CN",
              "value": "+86"
            }
          ]
        },
        "phone_number": "13900139000"
      }
    }
  ]
}
```

**Employee Status Options:**
- Active (在职)
- Inactive (离职)
- On Leave (休假)
- Probation (试用期)

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "employee": {
      "id": "6890452208593372690",
      "employee_type_id": "6890452208593372679",
      "worker_id": "1000001",
      "employee_number": "EMP001",
      "status": {
        "id": "6890452208593372680",
        "name": [
          {
            "lang": "zh-CN",
            "value": "在职"
          },
          {
            "lang": "en-US",
            "value": "Active"
          }
        ]
      },
      "hire_date": "2024-01-15",
      "personal_profile": {
        "gender": {
          "id": "6890452208593372681",
          "name": [
            {
              "lang": "zh-CN",
              "value": "男"
            },
            {
              "lang": "en-US",
              "value": "Male"
            }
          ]
        },
        "email": "john.doe@company.com",
        "phone": {
          "area_code": {
            "id": "6890452208593372684",
            "name": [
              {
                "lang": "zh-CN",
                "value": "+86"
              }
            ]
          },
          "phone_number": "13800138000"
        }
      },
      "created_time": "2024-01-15T10:00:00+08:00",
      "updated_time": "2024-01-15T10:00:00+08:00"
    }
  }
}
```

### Get Employee

```http
GET /corehr/v1/employees/{employee_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
```

### List Employees

```http
GET /corehr/v1/employees
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
- employee_type_id: string
- status: string
- hire_date_start: string (YYYY-MM-DD)
- hire_date_end: string (YYYY-MM-DD)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "id": "6890452208593372690",
        "employee_type_id": "6890452208593372679",
        "worker_id": "1000001",
        "employee_number": "EMP001",
        "status": {
          "id": "6890452208593372680",
          "name": [
            {
              "lang": "zh-CN",
              "value": "在职"
            },
            {
              "lang": "en-US",
              "value": "Active"
            }
          ]
        },
        "hire_date": "2024-01-15",
        "personal_profile": {
          "email": "john.doe@company.com",
          "phone": {
            "phone_number": "13800138000"
          }
        }
      }
    ],
    "has_more": false,
    "page_token": ""
  }
}
```

### Update Employee

```http
PATCH /corehr/v1/employees/{employee_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "status": {
    "id": "6890452208593372680",
    "name": [
      {
        "lang": "zh-CN",
        "value": "在职"
      },
      {
        "lang": "en-US",
        "value": "Active"
      }
    ]
  },
  "personal_profile": {
    "email": "john.doe.updated@company.com",
    "phone": {
      "area_code": {
        "id": "6890452208593372684",
        "name": [
          {
            "lang": "zh-CN",
            "value": "+86"
          }
        ]
      },
      "phone_number": "13900139000"
    }
  }
}
```

### Delete Employee

```http
DELETE /corehr/v1/employees/{employee_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json
```

## Department Management APIs

### Create Department

```http
POST /corehr/v1/departments
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "sub_type": {
    "id": "6890452208593372691",
    "name": [
      {
        "lang": "zh-CN",
        "value": "部门"
      },
      {
        "lang": "en-US",
        "value": "Department"
      }
    ]
  },
  "manager": "6890452208593372690",
  "is_confidential": false,
  "hiberarchy_common": {
    "parent_id": "6890452208593372692",
    "name": [
      {
        "lang": "zh-CN",
        "value": "技术部"
      },
      {
        "lang": "en-US",
        "value": "Technology Department"
      }
    ],
    "type": {
      "id": "6890452208593372693",
      "name": [
        {
          "lang": "zh-CN",
          "value": "部门"
        },
        {
          "lang": "en-US",
          "value": "Department"
        }
      ]
    },
    "active": true,
    "effective_time": "2024-01-01",
    "expiration_time": "",
    "code": "TECH",
    "description": [
      {
        "lang": "zh-CN",
        "value": "负责公司技术研发工作"
      },
      {
        "lang": "en-US",
        "value": "Responsible for company technology R&D"
      }
    ]
  },
  "tree_order": "001",
  "list_order": "001",
  "custom_fields": [
    {
      "field_name": "cost_center",
      "value": "CC001"
    }
  ]
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "department": {
      "id": "6890452208593372694",
      "sub_type": {
        "id": "6890452208593372691",
        "name": [
          {
            "lang": "zh-CN",
            "value": "部门"
          },
          {
            "lang": "en-US",
            "value": "Department"
          }
        ]
      },
      "manager": "6890452208593372690",
      "is_confidential": false,
      "hiberarchy_common": {
        "parent_id": "6890452208593372692",
        "name": [
          {
            "lang": "zh-CN",
            "value": "技术部"
          },
          {
            "lang": "en-US",
            "value": "Technology Department"
          }
        ],
        "active": true,
        "effective_time": "2024-01-01",
        "code": "TECH"
      },
      "created_time": "2024-01-01T10:00:00+08:00",
      "updated_time": "2024-01-01T10:00:00+08:00"
    }
  }
}
```

### Get Department

```http
GET /corehr/v1/departments/{department_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
```

### List Departments

```http
GET /corehr/v1/departments
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
- parent_department_id: string
- name: string
```

### Update Department

```http
PATCH /corehr/v1/departments/{department_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "manager": "6890452208593372695",
  "hiberarchy_common": {
    "name": [
      {
        "lang": "zh-CN",
        "value": "技术研发部"
      },
      {
        "lang": "en-US",
        "value": "Technology R&D Department"
      }
    ],
    "description": [
      {
        "lang": "zh-CN",
        "value": "负责公司核心技术研发和创新"
      },
      {
        "lang": "en-US",
        "value": "Responsible for core technology R&D and innovation"
      }
    ]
  }
}
```

## Job Management APIs

### Create Job

```http
POST /corehr/v1/jobs
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "code": "SE001",
  "name": [
    {
      "lang": "zh-CN",
      "value": "高级软件工程师"
    },
    {
      "lang": "en-US",
      "value": "Senior Software Engineer"
    }
  ],
  "description": [
    {
      "lang": "zh-CN",
      "value": "负责软件系统的设计和开发"
    },
    {
      "lang": "en-US",
      "value": "Responsible for software system design and development"
    }
  ],
  "active": true,
  "effective_time": "2024-01-01",
  "expiration_time": "",
  "job_level_id": "6890452208593372696",
  "job_family_id": "6890452208593372697",
  "department_id": "6890452208593372694",
  "head_count": 5,
  "is_key_position": true,
  "job_requirement": {
    "years_of_experience": 5,
    "highest_level_of_education": {
      "id": "6890452208593372698",
      "name": [
        {
          "lang": "zh-CN",
          "value": "本科"
        },
        {
          "lang": "en-US",
          "value": "Bachelor"
        }
      ]
    },
    "required_skills": [
      {
        "lang": "zh-CN",
        "value": "Java, Python, 数据库设计"
      },
      {
        "lang": "en-US",
        "value": "Java, Python, Database Design"
      }
    ]
  },
  "custom_fields": [
    {
      "field_name": "salary_range",
      "value": "20000-30000"
    }
  ]
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "job": {
      "id": "6890452208593372699",
      "code": "SE001",
      "name": [
        {
          "lang": "zh-CN",
          "value": "高级软件工程师"
        },
        {
          "lang": "en-US",
          "value": "Senior Software Engineer"
        }
      ],
      "active": true,
      "effective_time": "2024-01-01",
      "job_level_id": "6890452208593372696",
      "job_family_id": "6890452208593372697",
      "department_id": "6890452208593372694",
      "head_count": 5,
      "is_key_position": true,
      "created_time": "2024-01-01T10:00:00+08:00",
      "updated_time": "2024-01-01T10:00:00+08:00"
    }
  }
}
```

### Get Job

```http
GET /corehr/v1/jobs/{job_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
```

### List Jobs

```http
GET /corehr/v1/jobs
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
- department_id: string
- job_level_id: string
- job_family_id: string
- active: boolean
```

### Update Job

```http
PATCH /corehr/v1/jobs/{job_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "name": [
    {
      "lang": "zh-CN",
      "value": "资深软件工程师"
    },
    {
      "lang": "en-US",
      "value": "Staff Software Engineer"
    }
  ],
  "head_count": 8,
  "job_requirement": {
    "years_of_experience": 7,
    "required_skills": [
      {
        "lang": "zh-CN",
        "value": "Java, Python, 微服务架构, 云计算"
      },
      {
        "lang": "en-US",
        "value": "Java, Python, Microservices, Cloud Computing"
      }
    ]
  }
}
```

## Employment Management APIs

### Create Employment

```http
POST /corehr/v1/employments
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "employee_id": "6890452208593372690",
  "employment_type": {
    "id": "6890452208593372700",
    "name": [
      {
        "lang": "zh-CN",
        "value": "正式员工"
      },
      {
        "lang": "en-US",
        "value": "Full-time Employee"
      }
    ]
  },
  "person_type": {
    "id": "6890452208593372701",
    "name": [
      {
        "lang": "zh-CN",
        "value": "员工"
      },
      {
        "lang": "en-US",
        "value": "Employee"
      }
    ]
  },
  "primary_employment": true,
  "employment_status": {
    "id": "6890452208593372702",
    "name": [
      {
        "lang": "zh-CN",
        "value": "在职"
      },
      {
        "lang": "en-US",
        "value": "Active"
      }
    ]
  },
  "effective_time": "2024-01-15",
  "expiration_time": "",
  "job_data": {
    "job_id": "6890452208593372699",
    "job_level_id": "6890452208593372696",
    "job_family_id": "6890452208593372697",
    "assignment_start_reason": {
      "id": "6890452208593372703",
      "name": [
        {
          "lang": "zh-CN",
          "value": "新入职"
        },
        {
          "lang": "en-US",
          "value": "New Hire"
        }
      ]
    },
    "probation_start_date": "2024-01-15",
    "probation_end_date": "2024-04-15",
    "primary_job_data": true
  },
  "department_id": "6890452208593372694",
  "direct_manager_id": "6890452208593372704",
  "dotted_line_manager_id": "",
  "second_direct_manager_id": "",
  "cost_center_rate": [
    {
      "cost_center_id": "6890452208593372705",
      "rate": 100
    }
  ],
  "weekly_working_hours": 40,
  "work_location_id": "6890452208593372706",
  "company_id": "6890452208593372707",
  "custom_fields": [
    {
      "field_name": "employee_grade",
      "value": "P6"
    }
  ]
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "employment": {
      "id": "6890452208593372708",
      "employee_id": "6890452208593372690",
      "employment_type": {
        "id": "6890452208593372700",
        "name": [
          {
            "lang": "zh-CN",
            "value": "正式员工"
          },
          {
            "lang": "en-US",
            "value": "Full-time Employee"
          }
        ]
      },
      "primary_employment": true,
      "employment_status": {
        "id": "6890452208593372702",
        "name": [
          {
            "lang": "zh-CN",
            "value": "在职"
          },
          {
            "lang": "en-US",
            "value": "Active"
          }
        ]
      },
      "effective_time": "2024-01-15",
      "job_data": {
        "job_id": "6890452208593372699",
        "job_level_id": "6890452208593372696",
        "primary_job_data": true
      },
      "department_id": "6890452208593372694",
      "direct_manager_id": "6890452208593372704",
      "weekly_working_hours": 40,
      "created_time": "2024-01-15T10:00:00+08:00",
      "updated_time": "2024-01-15T10:00:00+08:00"
    }
  }
}
```

### Get Employment

```http
GET /corehr/v1/employments/{employment_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
```

### List Employments

```http
GET /corehr/v1/employments
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- department_id_type: string (open_department_id, department_id)
- employee_id: string
- employment_status: string
- effective_time_start: string (YYYY-MM-DD)
- effective_time_end: string (YYYY-MM-DD)
```

### Update Employment

```http
PATCH /corehr/v1/employments/{employment_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "job_data": {
    "job_id": "6890452208593372710",
    "job_level_id": "6890452208593372711"
  },
  "direct_manager_id": "6890452208593372712",
  "weekly_working_hours": 40,
  "custom_fields": [
    {
      "field_name": "employee_grade",
      "value": "P7"
    }
  ]
}
```

## Compensation Management APIs

### Create Compensation Plan

```http
POST /corehr/v1/compensation_plans
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "employee_id": "6890452208593372690",
  "plan_name": [
    {
      "lang": "zh-CN",
      "value": "2024年薪酬计划"
    },
    {
      "lang": "en-US",
      "value": "2024 Compensation Plan"
    }
  ],
  "effective_time": "2024-01-01",
  "expiration_time": "2024-12-31",
  "currency": {
    "id": "6890452208593372713",
    "name": [
      {
        "lang": "zh-CN",
        "value": "人民币"
      },
      {
        "lang": "en-US",
        "value": "CNY"
      }
    ]
  },
  "compensation_items": [
    {
      "compensation_type": {
        "id": "6890452208593372714",
        "name": [
          {
            "lang": "zh-CN",
            "value": "基本工资"
          },
          {
            "lang": "en-US",
            "value": "Base Salary"
          }
        ]
      },
      "amount": 25000,
      "frequency": {
        "id": "6890452208593372715",
        "name": [
          {
            "lang": "zh-CN",
            "value": "月"
          },
          {
            "lang": "en-US",
            "value": "Monthly"
          }
        ]
      }
    },
    {
      "compensation_type": {
        "id": "6890452208593372716",
        "name": [
          {
            "lang": "zh-CN",
            "value": "绩效奖金"
          },
          {
            "lang": "en-US",
            "value": "Performance Bonus"
          }
        ]
      },
      "amount": 50000,
      "frequency": {
        "id": "6890452208593372717",
        "name": [
          {
            "lang": "zh-CN",
            "value": "年"
          },
          {
            "lang": "en-US",
            "value": "Annual"
          }
        ]
      }
    }
  ]
}
```

### Get Compensation Plan

```http
GET /corehr/v1/compensation_plans/{plan_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
```

### List Compensation Plans

```http
GET /corehr/v1/compensation_plans
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- employee_id: string
- effective_time_start: string (YYYY-MM-DD)
- effective_time_end: string (YYYY-MM-DD)
```

## Performance Management APIs

### Create Performance Review

```http
POST /corehr/v1/performance_reviews
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "employee_id": "6890452208593372690",
  "review_period": {
    "start_date": "2024-01-01",
    "end_date": "2024-06-30"
  },
  "review_type": {
    "id": "6890452208593372718",
    "name": [
      {
        "lang": "zh-CN",
        "value": "半年度考核"
      },
      {
        "lang": "en-US",
        "value": "Semi-annual Review"
      }
    ]
  },
  "reviewer_id": "6890452208593372704",
  "review_status": {
    "id": "6890452208593372719",
    "name": [
      {
        "lang": "zh-CN",
        "value": "进行中"
      },
      {
        "lang": "en-US",
        "value": "In Progress"
      }
    ]
  },
  "goals": [
    {
      "goal_name": [
        {
          "lang": "zh-CN",
          "value": "完成项目A开发"
        },
        {
          "lang": "en-US",
          "value": "Complete Project A Development"
        }
      ],
      "goal_description": [
        {
          "lang": "zh-CN",
          "value": "按时完成项目A的开发工作，确保质量"
        },
        {
          "lang": "en-US",
          "value": "Complete Project A development on time with quality assurance"
        }
      ],
      "weight": 40,
      "target_value": "100%",
      "actual_value": "95%",
      "achievement_rate": 95
    }
  ],
  "overall_rating": {
    "id": "6890452208593372720",
    "name": [
      {
        "lang": "zh-CN",
        "value": "优秀"
      },
      {
        "lang": "en-US",
        "value": "Excellent"
      }
    ]
  },
  "comments": [
    {
      "lang": "zh-CN",
      "value": "表现优秀，超额完成目标"
    },
    {
      "lang": "en-US",
      "value": "Excellent performance, exceeded targets"
    }
  ]
}
```

### Get Performance Review

```http
GET /corehr/v1/performance_reviews/{review_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
```

### List Performance Reviews

```http
GET /corehr/v1/performance_reviews
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- employee_id: string
- reviewer_id: string
- review_period_start: string (YYYY-MM-DD)
- review_period_end: string (YYYY-MM-DD)
```

## Leave Management APIs

### Create Leave Request

```http
POST /corehr/v1/leave_requests
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "employee_id": "6890452208593372690",
  "leave_type": {
    "id": "6890452208593372721",
    "name": [
      {
        "lang": "zh-CN",
        "value": "年假"
      },
      {
        "lang": "en-US",
        "value": "Annual Leave"
      }
    ]
  },
  "start_date": "2024-03-01",
  "end_date": "2024-03-05",
  "start_time": "09:00",
  "end_time": "18:00",
  "leave_unit": {
    "id": "6890452208593372722",
    "name": [
      {
        "lang": "zh-CN",
        "value": "天"
      },
      {
        "lang": "en-US",
        "value": "Day"
      }
    ]
  },
  "leave_duration": 5,
  "reason": [
    {
      "lang": "zh-CN",
      "value": "家庭旅行"
    },
    {
      "lang": "en-US",
      "value": "Family vacation"
    }
  ],
  "approver_id": "6890452208593372704",
  "status": {
    "id": "6890452208593372723",
    "name": [
      {
        "lang": "zh-CN",
        "value": "待审批"
      },
      {
        "lang": "en-US",
        "value": "Pending Approval"
      }
    ]
  }
}
```

**Leave Status Options:**
- Pending Approval (待审批)
- Approved (已批准)
- Rejected (已拒绝)
- Cancelled (已取消)

### Get Leave Request

```http
GET /corehr/v1/leave_requests/{request_id}
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- user_id_type: string (user_id, union_id, open_id)
```

### List Leave Requests

```http
GET /corehr/v1/leave_requests
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- page_size: integer (1-100, default: 10)
- page_token: string
- user_id_type: string (user_id, union_id, open_id)
- employee_id: string
- leave_type_id: string
- status: string
- start_date_from: string (YYYY-MM-DD)
- start_date_to: string (YYYY-MM-DD)
```

### Approve Leave Request

```http
POST /corehr/v1/leave_requests/{request_id}/approve
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "approver_id": "6890452208593372704",
  "approval_comments": [
    {
      "lang": "zh-CN",
      "value": "批准请假申请"
    },
    {
      "lang": "en-US",
      "value": "Leave request approved"
    }
  ]
}
```

### Reject Leave Request

```http
POST /corehr/v1/leave_requests/{request_id}/reject
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

{
  "approver_id": "6890452208593372704",
  "rejection_reason": [
    {
      "lang": "zh-CN",
      "value": "项目紧急，无法批准请假"
    },
    {
      "lang": "en-US",
      "value": "Project urgency, cannot approve leave"
    }
  ]
}
```

## Organizational Structure APIs

### Get Organization Chart

```http
GET /corehr/v1/organization_chart
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- department_id_type: string (open_department_id, department_id)
- user_id_type: string (user_id, union_id, open_id)
- root_department_id: string
- max_depth: integer (1-10, default: 3)
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "organization_chart": {
      "department_id": "6890452208593372692",
      "department_name": [
        {
          "lang": "zh-CN",
          "value": "公司"
        },
        {
          "lang": "en-US",
          "value": "Company"
        }
      ],
      "manager": {
        "employee_id": "6890452208593372724",
        "name": "CEO"
      },
      "children": [
        {
          "department_id": "6890452208593372694",
          "department_name": [
            {
              "lang": "zh-CN",
              "value": "技术部"
            },
            {
              "lang": "en-US",
              "value": "Technology Department"
            }
          ],
          "manager": {
            "employee_id": "6890452208593372704",
            "name": "CTO"
          },
          "employee_count": 25,
          "children": []
        }
      ]
    }
  }
}
```

### Get Department Hierarchy

```http
GET /corehr/v1/departments/{department_id}/hierarchy
Authorization: Bearer <tenant_access_token>
Content-Type: application/json

Query Parameters:
- department_id_type: string (open_department_id, department_id)
- user_id_type: string (user_id, union_id, open_id)
- include_employees: boolean (default: false)
```

## Required Scopes

To use these APIs, your app needs the following scopes:

### Read Operations
- `corehr:employee:readonly` - Read employee information
- `corehr:department:readonly` - Read department information
- `corehr:job:readonly` - Read job information
- `corehr:employment:readonly` - Read employment information

### Write Operations
- `corehr:employee` - Full employee access
- `corehr:department` - Full department access
- `corehr:job` - Full job access
- `corehr:employment` - Full employment access

### Specific Permissions
- `corehr:compensation:readonly` - Read compensation data
- `corehr:performance:readonly` - Read performance data
- `corehr:leave:readonly` - Read leave data
- `corehr:organization:readonly` - Read organization structure

## Implementation Examples

### Example: Employee Onboarding Workflow

```javascript
async function onboardEmployee(accessToken, employeeData) {
  try {
    // Step 1: Create employee profile
    const employeeResponse = await axios.post(
      'https://open.feishu.cn/open-apis/corehr/v1/employees',
      {
        employee_type_id: employeeData.employeeTypeId,
        worker_id: employeeData.workerId,
        employee_number: employeeData.employeeNumber,
        status: {
          id: employeeData.statusId,
          name: [
            { lang: 'zh-CN', value: '在职' },
            { lang: 'en-US', value: 'Active' }
          ]
        },
        hire_date: employeeData.hireDate,
        personal_profile: {
          gender: employeeData.gender,
          date_of_birth: employeeData.dateOfBirth,
          phone: employeeData.phone,
          email: employeeData.email,
          address: employeeData.address
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (employeeResponse.data.code !== 0) {
      throw new Error(`Failed to create employee: ${employeeResponse.data.msg}`);
    }
    
    const employeeId = employeeResponse.data.data.employee.id;
    
    // Step 2: Create employment record
    const employmentResponse = await axios.post(
      'https://open.feishu.cn/open-apis/corehr/v1/employments',
      {
        employee_id: employeeId,
        employment_type: employeeData.employmentType,
        primary_employment: true,
        employment_status: employeeData.employmentStatus,
        effective_time: employeeData.hireDate,
        job_data: {
          job_id: employeeData.jobId,
          job_level_id: employeeData.jobLevelId,
          assignment_start_reason: employeeData.assignmentStartReason,
          probation_start_date: employeeData.probationStartDate,
          probation_end_date: employeeData.probationEndDate,
          primary_job_data: true
        },
        department_id: employeeData.departmentId,
        direct_manager_id: employeeData.managerId,
        weekly_working_hours: 40
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (employmentResponse.data.code !== 0) {
      throw new Error(`Failed to create employment: ${employmentResponse.data.msg}`);
    }
    
    // Step 3: Create compensation plan
    const compensationResponse = await axios.post(
      'https://open.feishu.cn/open-apis/corehr/v1/compensation_plans',
      {
        employee_id: employeeId,
        plan_name: [
          { lang: 'zh-CN', value: `${new Date().getFullYear()}年薪酬计划` },
          { lang: 'en-US', value: `${new Date().getFullYear()} Compensation Plan` }
        ],
        effective_time: employeeData.hireDate,
        currency: employeeData.currency,
        compensation_items: employeeData.compensationItems
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      employee: employeeResponse.data.data.employee,
      employment: employmentResponse.data.data.employment,
      compensation: compensationResponse.data.code === 0 ? compensationResponse.data.data.compensation_plan : null
    };
  } catch (error) {
    console.error('Failed to onboard employee:', error);
    throw error;
  }
}

// Usage
const onboardingResult = await onboardEmployee(tenantAccessToken, {
  employeeTypeId: '6890452208593372679',
  workerId: '1000002',
  employeeNumber: 'EMP002',
  statusId: '6890452208593372680',
  hireDate: '2024-02-01',
  gender: { id: '6890452208593372681' },
  dateOfBirth: '1992-08-20',
  phone: {
    area_code: { id: '6890452208593372684' },
    phone_number: '13900139001'
  },
  email: 'jane.smith@company.com',
  address: {
    country_region_id: '6890452208593372685',
    address_line_1: 'Building B, Floor 5'
  },
  employmentType: { id: '6890452208593372700' },
  employmentStatus: { id: '6890452208593372702' },
  jobId: '6890452208593372699',
  jobLevelId: '6890452208593372696',
  departmentId: '6890452208593372694',
  managerId: '6890452208593372704',
  probationStartDate: '2024-02-01',
  probationEndDate: '2024-05-01',
  currency: { id: '6890452208593372713' },
  compensationItems: [
    {
      compensation_type: { id: '6890452208593372714' },
      amount: 22000,
      frequency: { id: '6890452208593372715' }
    }
  ]
});
console.log('Employee onboarded:', onboardingResult);
```

### Example: Department Analytics

```javascript
async function getDepartmentAnalytics(accessToken, departmentId) {
  try {
    // Get department information
    const departmentResponse = await axios.get(
      `https://open.feishu.cn/open-apis/corehr/v1/departments/${departmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Get department employees
    const employeesResponse = await axios.get(
      'https://open.feishu.cn/open-apis/corehr/v1/employees',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 100
        }
      }
    );
    
    // Get department employments
    const employmentsResponse = await axios.get(
      'https://open.feishu.cn/open-apis/corehr/v1/employments',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 100
        }
      }
    );
    
    // Filter employments for this department
    const departmentEmployments = employmentsResponse.data.data.items.filter(
      employment => employment.department_id === departmentId
    );
    
    // Calculate analytics
    const analytics = {
      department: departmentResponse.data.data.department,
      totalEmployees: departmentEmployments.length,
      employmentTypes: {},
      jobLevels: {},
      averageWorkingHours: 0
    };
    
    let totalWorkingHours = 0;
    
    departmentEmployments.forEach(employment => {
      // Count employment types
      const empType = employment.employment_type.name.find(n => n.lang === 'en-US')?.value || 'Unknown';
      analytics.employmentTypes[empType] = (analytics.employmentTypes[empType] || 0) + 1;
      
      // Count job levels
      const jobLevel = employment.job_data?.job_level_id || 'Unknown';
      analytics.jobLevels[jobLevel] = (analytics.jobLevels[jobLevel] || 0) + 1;
      
      // Sum working hours
      totalWorkingHours += employment.weekly_working_hours || 40;
    });
    
    analytics.averageWorkingHours = departmentEmployments.length > 0 
      ? totalWorkingHours / departmentEmployments.length 
      : 0;
    
    return analytics;
  } catch (error) {
    console.error('Failed to get department analytics:', error);
    throw error;
  }
}

// Usage
const analytics = await getDepartmentAnalytics(tenantAccessToken, '6890452208593372694');
console.log('Department analytics:', analytics);
```

## Best Practices

1. **Data Consistency**: Ensure employee data is consistent across all systems
2. **Privacy Protection**: Handle personal information according to privacy regulations
3. **Audit Trail**: Maintain audit logs for all HR data changes
4. **Role-based Access**: Implement proper access controls for sensitive HR data
5. **Data Validation**: Validate all input data before creating or updating records
6. **Batch Operations**: Use batch APIs for bulk operations when available
7. **Error Handling**: Implement comprehensive error handling for HR operations
8. **Regular Sync**: Keep HR data synchronized with other systems

## Common Error Codes

- `1500101`: Invalid employee ID
- `1500102`: Invalid department ID
- `1500103`: Invalid job ID
- `1500104`: Employee not found
- `1500105`: Department not found
- `1500106`: Job not found
- `1500107`: Insufficient permissions
- `1500108`: Invalid employment status
- `1500109`: Invalid date format
- `1500110`: Duplicate employee number