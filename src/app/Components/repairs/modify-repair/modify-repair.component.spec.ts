import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyRepairComponent } from './modify-repair.component';

describe('ModifyRepairComponent', () => {
  let component: ModifyRepairComponent;
  let fixture: ComponentFixture<ModifyRepairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModifyRepairComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyRepairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
