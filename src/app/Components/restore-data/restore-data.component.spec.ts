import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreDataComponent } from './restore-data.component';

describe('RestoreDataComponent', () => {
  let component: RestoreDataComponent;
  let fixture: ComponentFixture<RestoreDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestoreDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestoreDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
